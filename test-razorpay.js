import Razorpay from 'razorpay';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

async function testRazorpayOrderCreation() {
  try {
    console.log('🧪 Testing Razorpay Order Creation...\n');

    const orderData = {
      amount: 500 * 100, // ₹500 in paise
      currency: 'INR',
      receipt: 'test_receipt_' + Date.now(),
      notes: {
        eventId: 'test-event-123',
        showId: 'test-show-456',
        userId: 'test-user-789',
        seats: 'A1,A2',
      },
    };

    console.log('Creating order with data:', orderData);

    const order = await razorpay.orders.create(orderData);

    console.log('✅ Order created successfully!');
    console.log('Order ID:', order.id);
    console.log('Amount:', order.amount);
    console.log('Currency:', order.currency);
    console.log('Status:', order.status);
    console.log('Receipt:', order.receipt);

    return order;

  } catch (error) {
    console.error('❌ Razorpay order creation failed:', error.message);
    throw error;
  }
}

// Test the function
testRazorpayOrderCreation()
  .then((order) => {
    console.log('\n🎉 Razorpay integration test passed!');
    console.log('You can use this order ID for payment testing:', order.id);
  })
  .catch((error) => {
    console.error('\n❌ Razorpay integration test failed!');
    process.exit(1);
  });