/* Router dependencies ------------------------------------------------------*/
const router      = require('express/lib/router')();
const { session } = require('../auth/auth.session');


/* Middlewares  -------------------------------------------------------------*/
const { 
  checkSessionExistsMiddleware, 
  retrieveSessionInfoMiddleware 
}  = require('../auth/auth.utils');

const { validateEventJSON } = require('../events/event.utils');
const { validateLayout    } = require('./layout.utils');


/* Parameters + Sessions ----------------------------------------------------*/
router.use(session);
router.use(checkSessionExistsMiddleware);
router.use(retrieveSessionInfoMiddleware);


/* Routes -------------------------------------------------------------------*/
router.post('/', 
  (req, res, next) => {
    // Stub
    req.package_id = 123;
    next();
  },  
  validateEventJSON,
  validateLayout,
  (req, res) => {
    const { uiowa_access_token, user_ip_address, body } = req;
    res.status(200).json({ uiowa_access_token, user_ip_address, body });
  });


// router.post('/')
//router.get('/:package_id', )
//router.patch('/:package_id', )
//router.delete('/:package_id', )
//router.get('/filter/my')
//router.get('/filter/public')



module.exports = router;