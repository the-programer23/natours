import '@babel/polyfill';
import axios from 'axios';

export const signup = async (firstName, lastName, email, travelAgencyName, password, confirmPassword) => {
    try {
        const res = await axios({
            method: 'POST',
            url: '/api/v1/users/signup',
            data: {
                firstName,
                lastName,
                email,
                travelAgencyName,
                password,
                confirmPassword
            }
        })

        if (res.data.status === 'success') {

            const firstName = name.firstName

            location.assign(`/?alert=signup&name=${firstName}&email=${email}`);
            // const firstName = name.split(' ')[0]
            // showAlertSignup('success', `Muy bien, ${firstName}. ¡Ya te registraste! Ahora verifica la bandeja de entrada de tu e-mail ${email} o en en Spam para confirmar tu cuenta`);
        }

    } catch (err) {
        showAlert('error', err.response.data.message);
    }
}