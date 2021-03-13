import '@babel/polyfill';
import axios from 'axios';
import {
    showAlert
} from './alert';

export const createTour = async (
    name,
    duration,
    maxGroupSize,
    difficulty,
    price,
    summary,
    description) => {
    try {
        console.log(name)
        const res = await axios({
            method: 'POST',
            url: '/api/v1/tours',
            data: {
                name,
                duration,
                maxGroupSize,
                difficulty,
                price,
                summary,
                description
            }
        })
        if (res.data.status === 'success') {
            showAlert('success', 'Felicidades, agregaste tu primer tour');
        }

    } catch (err) {
        console.log('error', err.response.data.message)
        showAlert('error', err.response.data.message);
    }
}