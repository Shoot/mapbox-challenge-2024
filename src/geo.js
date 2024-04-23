import React, { useState, useEffect } from 'react';

const GeolocationComponent = () => {
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const successHandler = (position) => {
      setLatitude(position.coords.latitude);
      setLongitude(position.coords.longitude);
      setError(null);
    };

    const errorHandler = (err) => {
      setError(err.message);
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(successHandler, errorHandler);
    } else {
      setError('Geolocation is not supported by this browser.');
    }
  }, []);

  return (
    <div>
      {error ? (
        <p>{error}</p>
      ) : (
        <p>
          Latitude: {latitude}, Longitude: {longitude}
        </p>
      )}
    </div>
  );
};

export default GeolocationComponent;
