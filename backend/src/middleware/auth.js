const jwt=require("jsonwebtoken");
module.exports=function auth(req,res,next){const h=req.headers.authorization||"";const [t,token]=h.split(" ");if(t!=="Bearer"||!token)return res.status(401).json({ok:false,mensaje:"Token requerido"});try{req.user=jwt.verify(token,process.env.JWT_SECRET);next();}catch(e){return res.status(401).json({ok:false,mensaje:"Token invalido o vencido"});}};
