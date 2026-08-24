import { Router } from 'express';
import { checkLocation, checkPincode } from '../controllers/locationController.js';
import { getHoneyVisionOffice } from '../config/companyLocation.js';

const router = Router();

router.post('/location/check', checkLocation);
router.get('/delivery/check/:pincode', checkPincode);
router.get('/location/honeyvision-office', (_req, res) => {
	const location = getHoneyVisionOffice();
	res.json({ success: true, location, configured: location.coordinates.lat !== null && location.coordinates.lng !== null });
});

export default router;
