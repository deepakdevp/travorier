# backend/app/api/v1/reviews.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.core.dependencies import get_current_user
from app.services.supabase import get_supabase_admin_client
from app.services.notification_service import create_and_send_notification

router = APIRouter(prefix="/reviews", tags=["Reviews"])


class SubmitReviewRequest(BaseModel):
    match_id: str
    rating: int = Field(ge=1, le=5)
    review_text: Optional[str] = None


class ReviewItem(BaseModel):
    id: str
    match_id: str
    reviewer_id: str
    reviewee_id: str
    rating: int
    review_text: Optional[str] = None
    reviewer_role: str
    pnr_verified_trip: bool
    created_at: datetime


@router.post("", status_code=201)
async def submit_review(
    body: SubmitReviewRequest,
    current_user=Depends(get_current_user),
) -> ReviewItem:
    """Submit a review for a delivered match. Both traveler and sender can review each other."""
    supabase = get_supabase_admin_client()
    user_id = str(current_user.id)

    # Fetch the match
    match_result = supabase.table("matches").select("*").eq("id", body.match_id).single().execute()
    if not match_result.data:
        raise HTTPException(status_code=404, detail="Match not found")
    m = match_result.data

    # Verify current user is a match participant
    if m["traveler_id"] != user_id and m["sender_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not a match participant")

    # Only allow reviews for delivered matches
    if m["status"] != "delivered":
        raise HTTPException(status_code=400, detail=f"Cannot review match with status: {m['status']}")

    # Determine reviewer role and reviewee
    if user_id == m["traveler_id"]:
        reviewer_role = "traveler"
        reviewee_id = m["sender_id"]
    else:
        reviewer_role = "sender"
        reviewee_id = m["traveler_id"]

    # Get pnr_verified from trip
    trip_result = supabase.table("trips").select("pnr_verified").eq("id", m["trip_id"]).single().execute()
    pnr_verified_trip = trip_result.data.get("pnr_verified", False) if trip_result.data else False

    # Insert review (UNIQUE constraint on match_id + reviewer_id prevents duplicates)
    try:
        result = supabase.table("reviews").insert({
            "match_id": body.match_id,
            "reviewer_id": user_id,
            "reviewee_id": reviewee_id,
            "rating": body.rating,
            "review_text": body.review_text,
            "reviewer_role": reviewer_role,
            "pnr_verified_trip": pnr_verified_trip,
        }).execute()
    except Exception as e:
        err_str = str(e).lower()
        if "unique" in err_str or "idx_reviews_unique" in err_str or "duplicate" in err_str:
            raise HTTPException(status_code=409, detail="You have already reviewed this match")
        raise HTTPException(status_code=500, detail="Failed to submit review")

    # Notify reviewee (fire-and-forget, never raises)
    create_and_send_notification(
        supabase,
        user_id=reviewee_id,
        title="You received a review! ⭐",
        body=f"Someone left you a {body.rating}-star review.",
        notification_type="review",
        related_entity_type="match",
        related_entity_id=body.match_id,
        deep_link="/profile",
    )

    return result.data[0]


@router.get("/user/{user_id}")
async def get_reviews_for_user(
    user_id: str,
) -> list[ReviewItem]:
    """Get approved reviews for a user (public). Most recent first, max 20."""
    supabase = get_supabase_admin_client()

    result = (
        supabase.table("reviews")
        .select("id, match_id, reviewer_id, reviewee_id, rating, review_text, reviewer_role, pnr_verified_trip, created_at")
        .eq("reviewee_id", user_id)
        .eq("approved", True)
        .order("created_at", desc=True)
        .limit(20)
        .execute()
    )
    return result.data or []
