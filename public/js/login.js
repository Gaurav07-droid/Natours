/* eslint-disable */
import axios from 'axios';
import { showAlerts } from './alerts';

export const login = async (email, password) => {
  try {
    const res = await axios({
      method: 'POST',
      url: 'http://127.0.0.1:3000/api/v1/users/login',
      data: {
        email,
        password,
      },
    });

    if (res.data.status === 'success') {
      showAlerts('success', 'Logged in successfully');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    showAlerts('error', err.response.data.message); //this will give the (postman) result
  }
};

export const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: 'http://127.0.0.1:3000/api/v1/users/logout',
    });

    if (res.data.status === 'success') location.assign('/');
  } catch (err) {
    // console.log(err.response);
    showAlerts('error', 'Error in logging out! Try again.');
  }
};
