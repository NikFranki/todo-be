const nodemailer = require('nodemailer');

// create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
  port: 465,               // true for 465, false for other ports
  host: "smtp.qq.com",
  auth: {
    user: '792032432@qq.com',
    pass: 'heafeuojysvkbcbd',
  },
  secure: true,
});

const defaultHtml = `<div>I love you,</div>

<div>Not for what you are,</div>

<div>But for what I am</div>

<div>When I am with you.</div>

<div>I love you,</div>

<div>Not only for what</div>

<div>You have made of yourself,</div>

<div>But for what</div>

<div>You are making of me.</div>

<div>I love you</div>

<div>For the part of me</div>

<div>That you bring out;</div>

<div>I love you</div>

<div>For putting your hand</div>

<div>Into my heaped-up heart</div>

<div>And passing over</div>

<div>All the foolish, weak things</div>

<div>That you can’t help</div>

<div>Dimly seeing there,</div>

<div>And for drawing out</div>

<div>Into the light</div>

<div>All the beautiful belongings</div>

<div>That no one else had looked</div>

<div>Quite far enough to find.</div>

<div>I love you because you</div>

<div>Are helping me to make</div>

<div>Of the lumber of my life</div>

<div>Not a tavern</div>

<div>But a temple;</div>

<div>Out of the works</div>

<div>Of my every day</div>

<div>Not a reproach</div>

<div>But a song.</div>

<div>I love you</div>

<div>Because you have done</div>

<div>More than any creed</div>

<div>Could have done</div>

<div>To make me good</div>

<div>And more than any fate</div>

<div>Could have done</div>

<div>To make me happy.</div>

<div>You have done it</div>

<div>Without a touch,</div>

<div>Without a word,</div>

<div>Without a sign.</div>

<div>You have done it</div>

<div>By being yourself.</div>

<div>Perhaps that is what</div>

<div>Being a lover means,</div>

<div>After all.</div>

<div>我爱你，</div>

<div>不光因为你的样子，</div>

<div>还因为，</div>

<div>和你在一起时，我的样子。</div>

<div>我爱你，</div>

<div>不光因为你为我而做的事，</div>

<div>还因为，</div>

<div>为了你，我能做成的事。</div>

<div>我爱你，</div>

<div>因为你能唤出，</div>

<div>我最真的那部分。</div>

<div>我爱你，</div>

<div>因为你穿越我心灵的旷野，</div>

<div>如同阳光穿越水晶般容易。</div>

<div>我的傻气，我的弱点，</div>

<div>在你的目光里几乎不存在。</div>

<div>而我心里最美丽的地方，</div>

<div>却被你的光芒照得通亮。</div>

<div>别人都不曾费心走那么远，</div>

<div>别人都觉得寻找太麻烦，</div>

<div>所以没人发现过我的美丽，</div>

<div>所以没人到过这里。</div>

<div>我爱你，</div>

<div>因为你将我的生活化腐朽为神奇。</div>

<div>因为有你，</div>

<div>我的生命，</div>

<div>不再是平凡的旅店，</div>

<div>而成为了恢弘的庙宇，</div>

<div>我日复一日的工作里，</div>

<div>不再充满抱怨，</div>

<div>而是美妙的旋律。</div>

<div>我爱你，</div>

<div>因为你比信念更能使我的生活变得无比美好，</div>

<div>因为你比命运更能使我的生活变得充满欢乐。</div>

<div>而你做出这一切的一切，</div>

<div>不费一丝力气，</div>

<div>一句言辞，</div>

<div>一个暗示，</div>

<div>你做出这一切的一切，</div>

<div>只是因为你就是你，</div>

<div>毕竟，</div>

<div>这也许就是爱人的含义。</div>`;
const emailTo = (
  to = 'myfriend@qq.com',
  subject = 'Sending Email using Node.js',
  text = 'super x',
  html = defaultHtml,
) => {
  const mailOptions = {
    from: '792032432@qq.com',  // sender address
    to,   // list of receivers
    subject,
    text,
    html,
    // An array of attachments
    attachments: [
      {
        filename: 'we.jpeg',
        path: '/Users/da.liu/Downloads/we.jpeg',
      },
    ],
  };

  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        reject(err);
      }
      else {
        resolve(info);
      }
    });
  });
};

const sendEmail = async (req, res, next) => {
  const { to, subject, text, html } = req.body;

  try {
    await emailTo(to, subject, text, html);
    res.send({
      code: 200,
      message: 'success',
    });
  } catch (error) {
    res.send({
      code: -1,
      message: 'failure',
    });
  }
};

module.exports = sendEmail;