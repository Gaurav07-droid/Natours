/* eslint-disable*/
import '@babel/polyfill';
import { login, logout } from './login';
import { displayMap } from './mapbox';
import { bookTour } from './stripe';
import { updateSettings } from './updateSettings';
import { showAlerts } from './alerts';

//dom elemets
const mapBox = document.getElementById('map');
const logoutbtn = document.querySelector('.nav__el--logout');

//////////////////////LOGIN FORM/////////////////////////////
const loginForm = document.querySelector('.form--login');
//values
const inputName = document.getElementById('name');
const inputEmail = document.getElementById('email');

//////////////////////USER-UPDATE FORM////////////////////////////////////
const formUserData = document.querySelector('.form-user-data');
// values
const email = document.getElementById('email');
const password = document.getElementById('password');
const photo = document.getElementById('photo');

///////////////////////SECURITY FORM///////////////////////////////////
const securityForm = document.querySelector('.form-user-settings');
//values
const curPassword = document.getElementById('password-current');
const newPassword = document.getElementById('password');
const confirmPassword = document.getElementById('password-confirm');

//////////////////////////////////////////////////
const bookBtn = document.getElementById('book-tour');

//delegation
if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);

  displayMap(locations);
}

if (loginForm) {
  loginForm.addEventListener('submit', function (e) {
    e.preventDefault();
    login(email.value, password.value);
  });
}

if (logoutbtn) {
  logoutbtn.addEventListener('click', () => {
    logout();
  });
}

if (formUserData) {
  formUserData.addEventListener('submit', async (e) => {
    document.querySelector('.btn--save-settings').textContent = 'saving...';
    e.preventDefault();

    //beacuse sending file/image then do this
    const form = new FormData();
    form.append('name', inputName.value);
    form.append('email', inputEmail.value);
    form.append('photo', photo.files[0]);
    console.log(form);

    await updateSettings(form, 'data');
    document.querySelector('.btn--save-settings').textContent = 'save settings';
  });
}

if (securityForm) {
  securityForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    document.querySelector('.btn--save-passsword').textContent = 'updating...';

    const passwordCurrent = curPassword.value;
    const password = newPassword.value;
    const passwordConfirm = confirmPassword.value;

    await updateSettings(
      { passwordCurrent, password, passwordConfirm },
      'password'
    );
    curPassword.value = '';
    newPassword.value = '';
    confirmPassword.value = '';
    document.querySelector('.btn--save-passsword').textContent =
      'save password';
  });
}

if (bookBtn)
  bookBtn.addEventListener('click', function (e) {
    e.target.textContent = 'Processing..';

    const { tourId } = e.target.dataset;
    bookTour(tourId);
  });

const alertMessage = document.querySelector('body').dataset.alert;
if (alert) showAlerts('success', alertMessage, 20);
