    
const multer=require('multer');
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/assets/answerAttachments')
    },
    filename: function (req, file, cb) {
        const originalnameList=file.originalname.split('.');
        const extension=originalnameList[originalnameList.length-1];
        cb(null, file.fieldname + '-' + Date.now()+'.'+extension);
    }
  });
   
var upload = multer({ storage: storage });
const {body, validationResult}=require('express-validator/check');
const {sanitizeBody}=require('express-validator/filter');
const ErrorHandler=require('../_helpers/error-handler');
const express=require('express');
const router=express.Router();
const required=require('./loginmiddlewares').required;
const User=require('./models').User;
const Question=require('./models').Question;
const Answer=require('./models').Answer;


var answer_post=
[
    upload.array('attachments'),

    body('answer').isLength({min:1}).withMessage('Answer field is empty'),

    sanitizeBody('answer').trim().escape(),
    
    (req,res)=>
    {
        console.log('Request made by user ',req.user);

        const errors=validationResult(req);
        if(!errors.isEmpty())
        {   
            return ErrorHandler(errors,req,res);
        }
        
        else
        {
        Question.findOne({ _id:req.params.questionId }, function (errQ, question) {
        
            if (errQ) 
               return ErrorHandler(errQ,req,res);
            else
            {
                question.numAnswers++;
                question.save((errSQ,question)=>{
                    console.log('question saved',question);
                    User.findOne({_id:req.user._id},(errU,user)=>{
                        if(errU)
                            return  ErrorHandler(errU,req,res);
                        else    
                        {
                            user.points+=question.points;
                            var user_updated=new User(user);
                            user_updated.save((errSU,user)=>{
                                if(errSU)
                                    return ErrorHandler(errSU);
                                console.log("Saved user is",user)
                                var attachmentslist=[];
                                if (req.files) {
                                for(var i=0;i<req.files.length;i++)
                                attachmentslist.push(req.files[i].filename);  
                                }
                                let answer=new Answer({
                                    answer:req.body.answer,
                                    questionId:question._id,
                                    givenBy:user._id,
                                    upvotes:0,
                                    downvotes:0,
                                    attachments:attachmentslist,
                                    embededlink:req.body.embededlinks
                                    });
                                                
                                answer.save((error,results)=>
                                {
                                    if(error)
                                    {
                                        return ErrorHandler(error,req,res);
                                    }
                                    else
                                    {
                                        console.log("Answer added ",results);
                                        res.status(200).end('Answer added successfully');	
                                    }
                                });
                            })
                        }
                    })
                })
            }        
       })
    }
}
];
router.post('/post-answer/:questionId',required,answer_post);

module.exports=router;
