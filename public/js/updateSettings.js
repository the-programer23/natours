/* eslint-disable */
import '@babel/polyfill';
import axios from 'axios';
import {
    showAlert
} from './alert';

//type is eather 'contraseña' or 'datos'
export const updateSettings = async (data, type) => {
    try {
        const url = type === 'contraseña' ? 'http://127.0.0.1:3000/api/v1/users/updateMyPassword' :
            'http://127.0.0.1:3000/api/v1/users/updateMe'

        const res = await axios({
            method: 'PATCH',
            url,
            data
        })
        if (res.data.status === 'success' && type === 'contraseña') {
            showAlert('success', 'Su contraseña se actualizó correctamente');
        } else if (res.data.status === 'success' && type === 'datos') {
            showAlert('success', 'Sus datos se actualizaron exitosamente');
        }

    } catch (err) {
        showAlert('error', err.response.data.message);
    }
}