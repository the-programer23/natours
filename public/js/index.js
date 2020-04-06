import {
    showAlert
} from './alert'

import {
    signup
} from './signup'

import {
    login,
    logout
} from './login'

import {
    displayMap
} from './mapbox'

import {
    updateSettings
} from './updateSettings'
import {
    bookTour
} from './stripe'

// DOM ELEMENTS
const mapBox = document.getElementById('map');
const signupForm = document.querySelector('.form--signup');
const logInForm = document.querySelector('.form--login');
const logoutBtn = document.querySelector('.nav__el--logout');
const userDataForm = document.querySelector('.form-user-data');
const updatePasswordForm = document.querySelector('.form-user-password');
const bookBtn = document.getElementById('book-tour')

// Delegation
if (mapBox) {
    const locations = JSON.parse(mapBox.dataset.locations);
    displayMap(locations)
};

if (signupForm) {
    signupForm.addEventListener('submit', e => {
        e.preventDefault();
        const firstName = document.getElementById('firstName').value;
        const lastName = document.getElementById('lastName').value;
        const email = document.getElementById('email').value;
        const travelAgencyName = document.getElementById('travelAgencyName').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        signup(firstName, lastName, email, travelAgencyName, password, confirmPassword)
    });
}

if (logInForm) {

    logInForm.addEventListener('submit', e => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        login(email, password);
    });
};

if (logoutBtn)
    logoutBtn.addEventListener('click', logout)

if (userDataForm)
    userDataForm.addEventListener('submit', e => {
        e.preventDefault();
        const form = new FormData();
        form.append('firstName', document.getElementById('firstName').value)
        form.append('lastName', document.getElementById('lastName').value)
        form.append('email', document.getElementById('email').value)
        form.append('travelAgencyName', document.getElementById('travelAgencyName').value)
        form.append('photo', document.getElementById('photo').files[0])
        // this passes name, email and photo values to axios and it put them in req.body for example req.body.name ...
        updateSettings(form, 'datos');
    });

if (updatePasswordForm)
    updatePasswordForm.addEventListener('submit', async e => {
        e.preventDefault();
        document.querySelector('.btn--save-password').textContent = 'Guardando...'
        const passwordCurrent = document.getElementById('password-current').value;
        const password = document.getElementById('password').value;
        const passwordConfirm = document.getElementById('password-confirm').value;
        await updateSettings({
            passwordCurrent,
            password,
            passwordConfirm
        }, 'contraseña');

        document.querySelector('.btn--save-password').textContent = 'Guardar contraseña'
        document.getElementById('password-current').value = ''
        document.getElementById('password').value = ''
        document.getElementById('password-confirm').value = ''
    })

if (bookBtn)
    bookBtn.addEventListener('click', e => {
        e.target.textContent = 'procesando...'
        const {
            tourId
        } = e.target.dataset
        bookTour(tourId)
    })

// the alertMessage variable gets the body attribite data-alert which is base.pug file 
const alertMessage = document.querySelector('body').dataset.alert;

if (alertMessage) showAlert('success', alertMessage, 2000)