/* Router dependencies ------------------------------------------------------*/
const router      = require('express/lib/router')();
const { session } = require('../auth/auth.session');


/* Middlewares  -------------------------------------------------------------*/
const { 
  checkSessionExistsMiddleware, 
  retrieveSessionInfoMiddleware 
}  = require('../auth/auth.utils');


/* Parameters + Sessions ----------------------------------------------------*/
router.use(session);
router.use(checkSessionExistsMiddleware);
router.use(retrieveSessionInfoMiddleware);


/* Routes -------------------------------------------------------------------*/
router.post('/', (req, res) => {
  const { uiowa_access_token, user_ip_address, body } = req;
  res.status(200).json({ uiowa_access_token, user_ip_address, body });
});




module.exports = router;