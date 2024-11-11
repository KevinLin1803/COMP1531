import express, { Request, Response } from 'express';
import { echo } from './echo';
import morgan from 'morgan';
import config from './config.json';
import {
  ReturnChannelCreate,
  ErrorChannelCreate,
  ReturnChannelList,
  ErrorChannelList,
  ReturnDmDetails,
  ErrorDmDetails,
  ErrorDmLeave,
  MessagesReturn,
  ErrorMessagesReturn,
} from './helper';
import { dmCreateV1, dmListV1, dmRemoveV1, dmDetailsV1, dmLeaveV1, dmMessagesV1 } from './dm';
import { authRegisterV2 } from './auth';
import { clearV1 } from './other';
import { messageSendDmV1, messageSendV1, messageEditV1, messageRemoveV1 } from './message';
import { channelsCreateV2, channelsListV3, channelsListallV3 } from './channels';
import { channelJoinV2, channelInviteV2, channelLeaveV1 } from './channel';
import { userProfileUploadPhoto, userStatsV1, usersStatsV1 } from './users';
import cors from 'cors';
import errorHandler from 'middleware-http-errors';

// Set up web app, use JSON
const app = express();
app.use(express.json());
// Use middleware that allows for access from other domains
app.use(cors());

app.use('/static', express.static('images'));

const PORT: number = parseInt(process.env.PORT || config.port);
const HOST: string = process.env.IP || 'localhost';

app.get('/echo', (req, res, next) => {
  try {
    const data = req.query.echo as string;
    return res.json(echo(data));
  } catch (err) {
    next(err);
  }
});

app.post('/channel/leave/v1', (req: Request, res: Response) => {
  // console.log('Channel Leave');
  const { token, channelId } = req.body;
  const removeFromChannel : any = channelLeaveV1(token, channelId);
  res.json(removeFromChannel);
});
/*
app.post('/channel/addowner/v1', (req: Request, res: Response) => {
  //console.log('Add Owner');
  const { token, channelId, uId } = req.body;
  const addChannelOwner : any = channelAddOwnerV1(token, channelId, uId);
  res.json(addChannelOwner);
});

app.post('/channel/removeowner/v1', (req: Request, res: Response) => {
  //console.log('Remove Owner');
  const { token, channelId, uId } = req.body;
  const removeChannelOwner : any = channelRemoveOwnerV1(token, channelId, uId);
  res.json(removeChannelOwner);
});

// user/profile
app.get('/user/profile/v2', (req: Request, res: Response) => {
  //console.log('User Profile');
  const { token, uId } = req.query;
  res.json(userProfileV2(String(token), Number(uId)));
});

// users/all
app.get('/users/all/v1', (req: Request, res: Response) => {
  //console.log('Users All');
  const token = req.query.token;
  res.json(usersAllV1(String(token)));
});

// user/profile/setname
app.put('/user/profile/setname/v1', (req: Request, res: Response) => {
  //console.log('User Profile Set Name');
  const { token, nameFirst, nameLast } = req.body;
  res.json(userProfileSetNameV1(String(token), String(nameFirst), String(nameLast)));
});

// user/profile/setemail
app.put('/user/profile/setemail/v1', (req: Request, res: Response) => {
  //console.log('User Profile Email');
  const { token, email } = req.body;
  res.json(userProfileSetEmailV1(String(token), String(email)));
});

// user/profile/sethandle
app.put('/user/profile/sethandle/v1', (req: Request, res: Response) => {
  //console.log('User Profile Set Handle');
  const { token, handleStr } = req.body;
  res.json(userProfileSetHandleV1(String(token), String(handleStr)));
});

app.post('/auth/login/v2', (req : Request, res: Response) => {
  const { email, password } = req.body;
  const loginResponse : ReturnAuthRegister | ErrorAuthRegister = authLoginV2(email, password);
  res.json(loginResponse);res.json(express.static('photos'))
});

app.post('/auth/logout/v1', (req: Request, res: Response) => {
  //console.log('Auth Logout');
  const { token } = req.body;
  res.json(authLogoutV1(String(token)));
});
*/
app.post('/auth/register/v2', (req : Request, res: Response) => {
  // console.log('Registering user');
  const { email, password, nameFirst, nameLast } = req.body;
  res.json(authRegisterV2(email, password, nameFirst, nameLast));
});

app.delete('/clear/v1', (req : Request, res : Response) => {
  // console.log('Clearing data');
  res.json(clearV1());
});

app.post('/dm/create/v1', (req : Request, res : Response) => {
  // console.log('Creating DM');
  const { uIds } = req.body;
  const token = (req.header('token'));
  res.json(dmCreateV1(token, uIds));
});

app.get('/dm/list/v1', (req : Request, res : Response) => {
  // console.log('Listing DMs');
  const token = (req.header('token'));
  res.json(dmListV1(token));
});

app.delete('/dm/remove/v1', (req : Request, res : Response) => {
  // console.log('Removing DM');
  const token = (req.header('token'));
  const dmId = req.query.dmId;
  res.json(dmRemoveV1(token, +dmId));
});

app.post('/message/senddm/v1', (req : Request, res : Response) => {
  /// /console.log('Sending DM');
  const { dmId, message } = req.body;
  const token = (req.header('token'));
  res.json(messageSendDmV1(token, dmId, message));
});

app.post('/channels/create/v2', (req: Request, res: Response) => {
  // console.log('Creating channel');
  const { name, isPublic } = req.body;

  const token = (req.header('token'));

  const channelId : ReturnChannelCreate | ErrorChannelCreate = channelsCreateV2(token, name, isPublic);
  res.json(channelId);
});

app.post('/message/send/v1', (req : Request, res: Response) => {
  // console.log('Sending message');
  const { token, channelId, message } = req.body;
  const messageSendResponse : {error: string; messageId?: undefined;} | {messageId: number; error?: undefined;} = messageSendV1(token, channelId, message);
  res.json(messageSendResponse);
});

app.put('/message/edit/v1', (req : Request, res: Response) => {
  // console.log('Editing message');
  const { token, messageId, message } = req.body;
  const messageEditResponse : {error: string;} | {error?: undefined;} = messageEditV1(token, messageId, message);
  res.json(messageEditResponse);
});

app.delete('/message/remove/v1', (req : Request, res: Response) => {
  // console.log('Removing message');
  const token = req.query.token as string;
  const messageId = Number(req.query.messageId);
  const messageRemoveResponse : {error: string;} | {error?: undefined;} = messageRemoveV1(token, messageId);
  res.json(messageRemoveResponse);
});

app.post('/channel/join/v2', (req: Request, res: Response) => {
  // console.log('Joining Channel');
  const { token, channelId } = req.body;
  const addToChannel = channelJoinV2(token, channelId);
  res.json(addToChannel);
});

app.post('/channel/invite/v2', (req: Request, res: Response) => {
  // console.log('Inviting to channel');
  const { token, channelId, uId } = req.body;
  const addToChannel = channelInviteV2(token, channelId, uId);
  res.json(addToChannel);
});
/*
app.get('/channel/details/v2', (req : Request, res : Response) => {
  //console.log('Retrieving channel details');
  const token = req.query.token as string;
  const channelId = req.query.channelId;
  res.json(channelDetailsV2(token, +channelId));
});

app.get('/channel/messages/v2', (req : Request, res : Response) => {
  //console.log('Retrieving channel messages');
  const token = req.query.token as string;
  const channelId = req.query.channelId;
  const start = req.query.start;
  res.json(channelMessagesV2(token, +channelId, +start));
});
*/
app.get('/channels/list/v3', (req: Request, res: Response) => {
  // console.log('Channels List');
  const token = (req.header('token'));
  const channelsDetails : ReturnChannelList | ErrorChannelList = channelsListV3(String(token));
  res.json(channelsDetails);
});

app.get('/channels/listall/v3', (req: Request, res: Response) => {
  // console.log('Channels List All');
  const token = (req.header('token'));
  const channelsDetails : ReturnChannelList | ErrorChannelList = channelsListallV3(String(token));
  res.json(channelsDetails);
});

app.get('/dm/details/v1', (req: Request, res: Response) => {
  // console.log('Dm Details');
  const { dmId } = req.query;
  const token = (req.header('token'));
  const dmDetails : ReturnDmDetails | ErrorDmDetails = dmDetailsV1(String(token), Number(dmId));
  res.json(dmDetails);
});

app.post('/dm/leave/v1', (req: Request, res: Response) => {
  // console.log('Dm Leave');
  const { dmId } = req.body;
  const token = (req.header('token'));
  // console.log(`DM leave parameters inputted are ${token} and ${dmId}`);
  const dmLeave : object | ErrorDmLeave = dmLeaveV1(String(token), Number(dmId));
  // console.log(`dmLeave return this ${dmLeave}`);
  res.json(dmLeave);
});

app.get('/dm/messages/v1', (req: Request, res: Response) => {
  // console.log('Dm Messages');
  const { dmId, start } = req.query;
  const token = (req.header('token'));
  const dmMessages : MessagesReturn | ErrorMessagesReturn = dmMessagesV1(String(token), Number(dmId), Number(start));
  res.json(dmMessages);
});

app.post('/user/profile/uploadphoto/v1', (req: Request, res: Response) => {
  const token = (req.header('token'));
  const { profileImgUrl, xStart, xEnd, yStart, yEnd } = req.body;
  res.json(userProfileUploadPhoto(token, profileImgUrl, xStart, yStart, xEnd, yEnd));
});

app.get('/user/stats/v1', (req: Request, res: Response) => {
  const token = (req.header('token'));

  res.json(userStatsV1(token));
});

app.get('/users/stats/v1', (req: Request, res: Response) => {
  const token = (req.header('token'));

  res.json(usersStatsV1(token));
});

// for logging errors
app.use(morgan('dev'));

app.use(errorHandler());

// start server
const server = app.listen(PORT, HOST, () => {
  console.log(`⚡️ Server listening on port ${PORT} at ${HOST}`);
});

// For coverage, handle Ctrl+C gracefully
process.on('SIGINT', () => {
  server.close(() => console.log('Shutting down server gracefully.'));
});
