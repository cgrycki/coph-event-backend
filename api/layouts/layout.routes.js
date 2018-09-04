/* Router dependencies ------------------------------------------------------*/
const router      = require('express/lib/router')();
const { session } = require('../auth/auth.session');


/* Middlewares  -------------------------------------------------------------*/
const { 
  checkSessionExistsMiddleware, 
  retrieveSessionInfoMiddleware 
}  = require('../auth/auth.utils');

const { 
  validateLayout,
  postLayoutMiddleware,
  getLayoutMiddleware,
  deleteLayoutMiddleware,
  patchLayoutMiddleware
} = require('./layout.utils');


/* Parameters + Sessions ----------------------------------------------------*/
router.use(session);
router.use(checkSessionExistsMiddleware);
router.use(retrieveSessionInfoMiddleware);


/* Routes -------------------------------------------------------------------*/
router.post('/',
  validateLayout,
  postLayoutMiddleware,
  (req, res) => res.status(200).json({ layout: req.validLayout }));


router.get('/:id',
  getLayoutMiddleware, 
  (req, res) => res.status(200).json(req.layout));


router.delete('/:id',
  deleteLayoutMiddleware,
  (req, res) => res.status(200).json({ package_id: req.params.id }));


router.patch('/:id',
  validateLayout,
  patchLayoutMiddleware,
  (req, res) => res.status(200).json({ layout: req.validLayout }));


//router.get('/filter/my')
//router.get('/filter/public')

module.exports = router;