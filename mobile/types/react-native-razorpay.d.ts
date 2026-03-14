declare module 'react-native-razorpay' {
  interface RazorpayOptions {
    description: string;
    currency: string;
    key: string;
    amount: string;
    order_id: string;
    name: string;
    prefill?: Record<string, string>;
    theme?: { color: string };
  }
  interface RazorpaySuccessData {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }
  const RazorpayCheckout: {
    open(options: RazorpayOptions): Promise<RazorpaySuccessData>;
  };
  export default RazorpayCheckout;
}
