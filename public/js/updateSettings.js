import axios from 'axios';
import { showAlerts } from './alerts';

const sendAlert = (res, type) => {
  if (res.data.status === 'success') {
    showAlerts('success', `${type} updated successfully!`);
    window.setTimeout(() => {
      location.reload(true);
    }, 1500);
  }
};

export const updateSettings = async (data, type) => {
  try {
    let url =
      type === 'password'
        ? '/api/v1/users/updateMyPassword'
        : '/api/v1/users/updateMe';

    const res = await axios({
      method: 'PATCH',
      url,
      data,
    });

    // console.log(res);

    //sending successfull alert
    sendAlert(res, type.toUpperCase());
  } catch (err) {
    showAlerts('error', err.response.data.message);
    // console.log(err);
  }
};

//SEPERATE FUNCTION FOR PASSSWORD UPDATE
// export const updatePassword = async (
//   passwordCurrent,
//   password,
//   passwordConfirm
// ) => {
//   try {
//     const res = await axios({
//       method: 'PATCH',
//       url: 'http://127.0.0.1:3000/api/v1/users/updateMyPassword',
//       data: {
//         passwordCurrent,
//         password,
//         passwordConfirm,
//       },
//     });

//     //sending successfull alert
//     sendAlert(res);
//   } catch (err) {
//     showAlerts('error', err.response.data.message);
//     console.log(err);
//   }
// };
