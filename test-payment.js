import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

// Test data
const testData = {
  eventId: 'test-event-123',
  showId: '67b1234567890abcdef12345', // Mock ObjectId
  seatIds: ['A1', 'A2'],
  ticketPrice: 250
};

async function testPaymentFlow() {
  try {
    console.log('🧪 Testing Payment Flow...\n');

    // Test 1: Create Razorpay Order
    console.log('1. Testing create-razorpay-order endpoint...');
    try {
      const createOrderResponse = await axios.post(`${API_BASE_URL}/payment/create-razorpay-order`, testData);
      console.log('✅ Create Order Response:', createOrderResponse.data);

      if (createOrderResponse.data.success) {
        console.log('✅ Order created successfully!');
        console.log('   Order ID:', createOrderResponse.data.orderId);
        console.log('   Amount:', createOrderResponse.data.amount);
        console.log('   Currency:', createOrderResponse.data.currency);
      } else {
        console.log('❌ Order creation failed:', createOrderResponse.data.error);
      }
    } catch (error) {
      console.log('❌ Create Order Error:', error.response?.data || error.message);
    }

    // Test 2: Test occupied seats endpoint
    console.log('\n2. Testing occupied seats endpoint...');
    try {
      const occupiedSeatsResponse = await axios.get(`${API_BASE_URL}/booking/seats/${testData.showId}`);
      console.log('✅ Occupied Seats Response:', occupiedSeatsResponse.data);
    } catch (error) {
      console.log('❌ Occupied Seats Error:', error.response?.data || error.message);
    }

    // Test 3: Test server health
    console.log('\n3. Testing server health...');
    try {
      const healthResponse = await axios.get(`${API_BASE_URL.replace('/api', '')}`);
      console.log('✅ Server Health:', healthResponse.data);
    } catch (error) {
      console.log('❌ Server Health Error:', error.message);
    }

    console.log('\n🎉 Payment flow test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testPaymentFlow();