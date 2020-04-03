import axios from 'axios'
import showAlert from './alert'
const stripe = Stripe('pk_test_gZhydk3m6oRAQs96CqN0TDQn00GUx6FpT3')

export const bookTour = async tourId => {
    try { // 1) Get checkout session from api
        const session = await axios(
            `http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`);
        console.log(session)

        // 2) Create Checkout session + charge card
        await stripe.redirectToCheckout({
            sessionId: session.data.session.id
        })

    } catch (err) {
        console.log(err)
        showAlert('error', err)
    }
}