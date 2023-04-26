// Comment out line 2 and uncomment line 3 to get fixed/expected behavior.
global.someNonExistentVariable && await 'test';
// await 'test';

console.log('here 2');

export {};
