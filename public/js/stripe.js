/* eslint-disable */
import axios from 'axios';
import { showAlerts } from './alerts';

const stripe = Stripe(
  'pk_test_51KyyOZSDyhrWsx3IAJdeDcP0tpkxwXpBos71WE6aIUIJRHpbJ4nYwapJMXjUR79mH5AyGsPsasD8y83TepmPKqe000bGF56z2e'
);

export const bookTour = async (tourId) => {
  try {
    //get checkout session from API
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);
    // console.log(session);

    //create checkout form + charge the card
    // console.log(stripe);
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    // console.log(err);
    showAlerts('error', err);
  }
};
