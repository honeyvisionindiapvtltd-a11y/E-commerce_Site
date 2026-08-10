import { Router } from 'express';
import { checkLocation, checkPincode } from '../controllers/locationController.js';

const router = Router();

router.post('/location/check', checkLocation);
router.get('/delivery/check/:pincode', checkPincode);

export default router;
