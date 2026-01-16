const { HarmCategory, HarmBlockThreshold } = require("@google/genai")
const Thumbnail = require("../model/thumbnail")
const ai = require("../config/ai")
const path=require('path')
const fs=require('fs')
const cloudinary= require('cloudinary').v2


exports.generateThumbnail=async(req,res)=>{
  try {
    const stylePrompts = {
    'Bold & Graphic': 'eye-catching thumbnail, bold typography, vibrant colors, expressive facial reaction, dramatic lighting, high contrast, click-worthy composition, professional style',
    'Tech/Futuristic': 'futuristic thumbnail, sleek modern design, digital UI elements, glowing accents, holographic effects, cyber-tech aesthetic, sharp lighting, high-tech atmosphere',
    'Minimalist': 'minimalist thumbnail, clean layout, simple shapes, limited color palette, plenty of negative space, modern flat design, clear focal point',
    'Photorealistic': 'photorealistic thumbnail, ultra-realistic lighting, natural skin tones, candid moment, DSLR-style photography, lifestyle realism, shallow depth of field',
    'Illustrated': 'illustrated thumbnail, custom digital illustration, stylized characters, bold outlines, vibrant colors, creative cartoon or vector art style',
}
const colorSchemeDescriptions = {
    vibrant: 'vibrant and energetic colors, high saturation, bold contrasts, eye-catching palette',
    sunset: 'warm sunset tones, orange pink and purple hues, soft gradients, cinematic glow',
    forest: 'natural green tones, earthy colors, calm and organic palette, fresh atmosphere',
    neon: 'neon glow effects, electric blues and pinks, cyberpunk lighting, high contrast glow',
    purple: 'purple-dominant color palette, magenta and violet tones, modern and stylish mood',
    monochrome: 'black and white color scheme, high contrast, dramatic lighting, timeless aesthetic',
    ocean: 'cool blue and teal tones, aquatic color palette, fresh and clean atmosphere',
    pastel: 'soft pastel colors, low saturation, gentle tones, calm and friendly aesthetic',
}
      const {userId}=req.session
      const {title,style,aspect_ratio,color_scheme,text_overlay,user_prompt}=req.body
       const safeStyle = style || "Bold & Graphic"
            const thumbnail = new Thumbnail({
                 userId,title,style:safeStyle,aspect_ratio,color_scheme,text_overlay,user_prompt,prompt_used:user_prompt,isGenerating:true
                })
           
                await thumbnail.save()

                const model="gemini-3-pro-image-preview"
                const generationConfig={
                    maxOutputTokens:32768,
                    temperature:1,
                    topP:0.95,
                    responseModalities:['IMAGE'],
                    imageConfig:{
                        aspectRatio:aspect_ratio||"16:9",
                        imageSize:"1k"
                    },
                    safetySettings:[
                        {category:HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                            threshold:HarmBlockThreshold.OFF},
                            {category:HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
threshold:HarmBlockThreshold.OFF
                            },
                            {category:HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
threshold:HarmBlockThreshold.OFF
                            },
                            {category:HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
threshold:HarmBlockThreshold.OFF
                            },
                            {category:HarmCategory.HARM_CATEGORY_HARASSMENT,
threshold:HarmBlockThreshold.OFF
                            }
                    ]
                }
                let prompt= `Create a ${stylePrompts[style]} for:${title}`
                if(color_scheme){
                    prompt+= `use a ${colorSchemeDescriptions[color_scheme]} color scheme`
                }
                if(user_prompt){
                    prompt+=`Additional details:${user_prompt}`
                }
                prompt+= `the thumbnail should be ${aspect_ratio}, Visually stunning and designed to maximize click-through rate.Make it bold,professional and impossible to ignore `

                const response= await ai.models.generateContent({
                    model,
                    contents:[prompt],
                    config:generationConfig
                })
                if(!response?.candidates?.[0]?.content?.parts){
                   throw new Error('Unexpected Response')
                }
                const parts=response?.candidates?.[0]?.content?.parts
                let finalBuffer=null
                for(const part of parts){
                    if(part.inlineData){
                        finalBuffer=Buffer.from(part.inlineData.data,'base64')
                    }
                }
                const filename=`final-output-${Date.now()}.png`;
                const pathname=path.join('images',filename)
                // create image directory if it does not exist
                fs.mkdirSync('images',{recursive:true})
                // writ the final image to file
                fs.writeFileSync(pathname,finalBuffer)

                cloudinary.config({
    cloud_name:process.env.CLOUDINARY_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET
})
 const result = await cloudinary.uploader.upload(pathname,{
        resource_type:'image'
    })
    thumbnail.image_url=result.url
    thumbnail.isGenerating=false
await thumbnail.save()

res.json({
    message:"Thumbnail Generated",
    thumbnail
})

fs.unlinkSync(pathname)
} catch (error) {
      res.status(500).json({
        message:error.message,
        success:false
    })
  }
}


exports.deleteThumbnail=async(req,res)=>{
    try {
       const { id } = req.params;
  const {userId} = req.session;

  const deleted = await Thumbnail.findOneAndDelete({
    _id: id,
    userId
  });

  if (!deleted) {
    return res.status(404).json({
      success: false,
      message: 'Thumbnail not found or unauthorized'
    });
  }

  res.json({ success: true ,
    message: 'Thumbnail deleted successfully'
  });
        
    } catch (error) {
        res.status(500).json({
        message:error.message,
        success:false
    })  
    }
}
