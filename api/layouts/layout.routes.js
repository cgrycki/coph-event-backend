/* Router dependencies ------------------------------------------------------*/
const router      = require('express/lib/router')();
//const { session } = require('../auth/auth.session');


/* Middlewares  -------------------------------------------------------------*/
const { 
  checkSessionExistsMiddleware, 
  retrieveSessionInfoMiddleware 
}  = require('../auth/auth.utils');

const { 
  validateLayout,
  postLayoutMiddleware,
  getLayoutMiddleware,
  getLayoutsMiddleware,
  deleteLayoutMiddleware,
  patchLayoutMiddleware
} = require('./layout.utils');


/* Parameters + Sessions ----------------------------------------------------*/
//router.use(session);
//router.use(checkSessionExistsMiddleware);
//router.use(retrieveSessionInfoMiddleware);


/* Routes -------------------------------------------------------------------*/
/** Creates a new layout */
router.post('/',
  validateLayout,
  postLayoutMiddleware,
  (req, res) => res.status(200).json({ layout: req.validLayout }));


/** Returns a layout with matching `id` */
router.get('/:id',
  getLayoutMiddleware, 
  (req, res) => res.status(200).json(req.layout));


/** Deletes a layout */
router.delete('/:id',
  deleteLayoutMiddleware,
  (req, res) => res.status(200).json({ id: req.params.id }));


/** Updates a layout */
router.patch('/:id',
  validateLayout,
  patchLayoutMiddleware,
  (req, res) => res.status(200).json({ layout: req.layout }));


/** Returns a filtered list of user's layouts. */
router.get('/filter/my',
  getLayoutsMiddleware,
  (req, res) => res.status(200).json({ layouts: req.layouts }));


/** Returns public layouts accessible to all users. */
router.get('/filter/public',
  getLayoutsMiddleware,
  (req, res) => res.status(200).json({ layouts: req.layouts }));


module.exports = router;