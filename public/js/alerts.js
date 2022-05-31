/*eslint-disable */

const hideAlert = () => {
  const el = document.querySelector('.alert');
  if (el) el.parentElement.removeChild(el);
};

//type ?success:error
export const showAlerts = (type, mssg, time = 7) => {
  //fisrt hide all alerts
  hideAlert();

  const markup = `<div class="alert alert--${type}">${mssg}</div>`;

  document.querySelector('body').insertAdjacentHTML('afterbegin', markup);

  window.setTimeout(hideAlert, time * 1000);
};
