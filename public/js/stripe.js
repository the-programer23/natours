import axios from 'axios'
import showAlert from './alert'
const stripe = Stripe('pk_test_gZhydk3m6oRAQs96CqN0TDQn00GUx6FpT3')

export const bookTour = async tourId => {
    try {

        // 1) Get checkout session from api
        const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);

        // 2) Create Checkout session + charge card
        await stripe.redirectToCheckout({
            sessionId: session.data.session.id
        })

    } catch (err) {
        showAlert('error', err)
    }
}