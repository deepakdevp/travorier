"""
Travorier FastAPI Application
Main entry point for the backend API
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

from app.core.config import settings
from app.api.v1 import auth, users, trips, requests as requests_api, matches, payments


# Initialize Sentry for error tracking (if DSN is provided)
if settings.SENTRY_DSN:
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        integrations=[FastApiIntegration()],
        environment=settings.ENVIRONMENT,
        traces_sample_rate=1.0 if settings.DEBUG else 0.1,
    )


# Create FastAPI app instance
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Crowdsourced logistics platform API",
    docs_url="/docs" if settings.DEBUG else None,  # Disable docs in production
    redoc_url="/redoc" if settings.DEBUG else None,
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json" if settings.DEBUG else None,
)


# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    return JSONResponse(
        content={
            "status": "healthy",
            "service": settings.PROJECT_NAME,
            "version": settings.VERSION,
            "environment": settings.ENVIRONMENT
        }
    )


# Root endpoint
@app.get("/")
async def root():
    """API root endpoint"""
    return JSONResponse(
        content={
            "message": "Welcome to Travorier API",
            "version": settings.VERSION,
            "docs": f"{settings.API_V1_PREFIX}/docs" if settings.DEBUG else "Documentation disabled in production"
        }
    )


# Include API routers
# app.include_router(auth.router, prefix=settings.API_V1_PREFIX, tags=["Authentication"])
# app.include_router(users.router, prefix=settings.API_V1_PREFIX, tags=["Users"])
# app.include_router(trips.router, prefix=settings.API_V1_PREFIX, tags=["Trips"])
# app.include_router(requests_api.router, prefix=settings.API_V1_PREFIX, tags=["Requests"])
# app.include_router(matches.router, prefix=settings.API_V1_PREFIX, tags=["Matches"])
# app.include_router(payments.router, prefix=settings.API_V1_PREFIX, tags=["Payments"])


# Exception handlers
@app.exception_handler(404)
async def not_found_handler(request, exc):
    """Custom 404 handler"""
    return JSONResponse(
        status_code=404,
        content={"detail": "Resource not found"}
    )


@app.exception_handler(500)
async def internal_error_handler(request, exc):
    """Custom 500 handler"""
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )


# Startup event
@app.on_event("startup")
async def startup_event():
    """Run on application startup"""
    print(f"🚀 {settings.PROJECT_NAME} v{settings.VERSION} starting up...")
    print(f"📝 Environment: {settings.ENVIRONMENT}")
    print(f"🔗 API Prefix: {settings.API_V1_PREFIX}")
    if settings.DEBUG:
        print(f"📚 API Docs: http://localhost:8000/docs")


# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Run on application shutdown"""
    print(f"👋 {settings.PROJECT_NAME} shutting down...")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )
