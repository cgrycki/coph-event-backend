/* Router dependencies ------------------------------------------------------*/
const router      = require('express/lib/router')();
//const { session } = require('../auth/auth.session');


/* Middlewares  -------------------------------------------------------------*/
const { 
  checkSessionExistsMiddleware, 
  retrieveSessionInfoMiddleware 
}  = require('../auth/auth.utils');


/* Parameters + Sessions ----------------------------------------------------*/
//router.use(session);
//router.use(checkSessionExistsMiddleware);
//router.use(retrieveSessionInfoMiddleware);


/* Routes -------------------------------------------------------------------*/
router.post('/', (req, res) => {
  const payload = req.body;

  res.status(200).json(payload);
});




module.exports = router;