import {createOrderPreview} from '../scripts/order-preview.mjs';
createOrderPreview().app.listen(3136,'127.0.0.1',()=>console.log('Cinematic kiosk preview: http://127.0.0.1:3136'));
