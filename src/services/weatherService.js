import axios from 'axios';

const WEATHER_API_KEY = 'c48c01ab4475dd8589ace2105704e4b8'; // OpenWeatherMap API key

export const getWeatherInfo = async (coords) => {
    try {
        const { latitude, longitude } = coords;
        const response = await axios.get(
            `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${WEATHER_API_KEY}&units=metric&lang=tr`
        );

        if (response.data) {
            return {
                temperature: response.data.main.temp,
                condition: response.data.weather[0].main.toLowerCase(),
                description: response.data.weather[0].description,
                icon: response.data.weather[0].icon,
                humidity: response.data.main.humidity,
                windSpeed: response.data.wind.speed
            };
        }

        return {
            condition: 'sunny', // varsayılan değer
            description: 'Normal hava koşulları'
        };
    } catch (error) {
        console.error('Hava durumu bilgisi alınamadı:', error);
        return {
            condition: 'sunny',
            description: 'Normal hava koşulları'
        };
    }
}; 