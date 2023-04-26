# webpack-15899-tla-regression

This is a minimal reproducible example for the regression caused in webpack by an update to TLA in version 5.73.0, discussion in issue #16097.

<br />
<br />

STEP 1:

Run the following (note the bug also happens with dev, i.e. `build:dev`):
```bash
npm run build:prod && node dist/main.js
```
You will see that only the following line is printed:
```
here 2
```

<br />
<br />

STEP 2:

Go into the file `src/moduleWithTLA.js` and follow the instruction on the first line (pasted here for reference):
```
Comment out line 2 and uncomment line 3 to get fixed/expected behavior.
```

<br />
<br />

STEP 3:

Run the following:
```bash
npm run build:prod && node dist/main.js
```
You will see now that the correct 2 lines are printed:
```
here 2
here 1
```

<br />
<br />

Some debugging I did with my free time into this issue:

The forced `await` statement is needed for some reason because I am fairly certain there is a bug in webpack with TLA (top-level await), where a module has top-level await but does it conditionally (like 'variable && ...'). Here, webpack does not load the module chain correctly. It seems like this is the case because of the order that the JS runtime executes async functions.
Ex:

CASE 1:
```js
> (async () => { console.log('test 1'); })(); console.log('test 2');
test 1
test 2
```

CASE 2:
```js
> (async () => { await 'test'; console.log('test 1'); })(); console.log('test 2');
test 2
test 1
```

The await causes the statement outside the async function to run first.

Using a dummy `await 'test'` in `moduleWithTLA.js` forces the JS runtime to execute like CASE 2 and I'm guessing webpack assumes this behavior always occurs.

From deep-dive into webpack, it appears that it is setting `hasAwait`, for the `__webpack_require__.a` invocation with this module, to `1`. Here is an excerpt of that from the build:
```js
/***/ 795:
/***/ ((module, __unused_webpack___webpack_exports__, __webpack_require__) => {

__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
// Comment out line 2 and uncomment line 3 to get fixed/expected behavior.
__webpack_require__.g.someNonExistentVariable && await 'test';
// await 'test';

console.log('here 2');



__webpack_async_result__();
} catch(e) { __webpack_async_result__(e); } }, 1); // <--- THIS `1` RIGHT HERE

/***/ })
```
Note the comment "THIS \`1\` RIGHT HERE" marking the code of interest. This `1` seems like it would be correct, since the module does contain a top-level await. But it may not actually execute that await statement if done conditionally like above. If you remove the `1` (the last function argument entirely), the code runs correctly. But this can't be an actual solution obviously because the await statement could run sometimes depending on the condition.

This is the extent to which I debugged the issue to determine it is likely a webpack bug.

