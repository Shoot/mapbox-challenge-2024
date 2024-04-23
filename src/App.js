import React from 'react';
import GeolocationComponent from './geo';
import TabUrlComponent from './url';

const App = () => {
  return (
    <div>
      <h1>Onliner-map</h1>
      <GeolocationComponent />
      <TabUrlComponent />
    </div>
  );
};

export default App;