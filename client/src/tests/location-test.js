
import { calculateDistance, testDistanceCalculation } from '../lib/location-utils';
import { isWithinHappyHour } from '../lib/time-utils';

// Test Haversine distance calculation
console.log('\n======= DISTANCE CALCULATION TESTS =======');
const distance = testDistanceCalculation();
console.log('Distance test: ' + (distance > 15 && distance < 18 ? 'PASSED ✅' : 'FAILED ❌'));

// Test manual calculation
const distance2 = calculateDistance(1.2834, 103.8607, 1.3644, 103.9915);
console.log('MBS to Changi: ' + distance2 + ' km');

// Examples with different distances in Singapore
const distanceOk = calculateDistance(1.2845, 103.8498, 1.2898, 103.8529); // Marina Bay to Raffles Place
console.log('Marina Bay to Raffles Place: ' + distanceOk + ' km');

const distanceMedium = calculateDistance(1.2834, 103.8607, 1.3099, 103.7892); // MBS to Holland Village
console.log('MBS to Holland Village: ' + distanceMedium + ' km');

const distanceLong = calculateDistance(1.2834, 103.8607, 1.3959, 103.9111); // MBS to Punggol
console.log('MBS to Punggol: ' + distanceLong + ' km');

// Test happy hour status
console.log('\n======= HAPPY HOUR TESTS =======');
// Create a test date for Wednesday 6:30 PM SGT (in happy hour)
const testDate1 = new Date();
testDate1.setHours(18);
testDate1.setMinutes(30);

// Create a test date for Wednesday 9:30 PM SGT (outside happy hour)
const testDate2 = new Date();
testDate2.setHours(21);
testDate2.setMinutes(30);

// Test some happy hour combinations
console.log('Active happy hour (6:30 PM): ' + 
  isWithinHappyHour('16:00', '19:00', 'All Days', testDate1));

console.log('Inactive happy hour (9:30 PM): ' + 
  isWithinHappyHour('16:00', '19:00', 'All Days', testDate2));

// Test with numeric time format (for deals that use 1400 format)
console.log('1400 format test - Active: ' + 
  isWithinHappyHour('1200', '2000', 'All Days', testDate1));

console.log('1400 format test - Inactive: ' + 
  isWithinHappyHour('1200', '1800', 'All Days', testDate2));

