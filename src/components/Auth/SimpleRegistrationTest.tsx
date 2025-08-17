import React from 'react';

const SimpleRegistrationTest: React.FC = () => {
  const handleClick = () => {
    console.log('🎯 Simple test button clicked!');
    alert('Button works!');
  };

  return (
    <div style={{ padding: '20px', background: 'white', color: 'black' }}>
      <h2>Registration Test</h2>
      <button onClick={handleClick} style={{ padding: '10px 20px', background: 'blue', color: 'white' }}>
        Test Button
      </button>
    </div>
  );
};

export default SimpleRegistrationTest;
