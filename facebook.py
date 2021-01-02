import random
from flask import Flask, request
#from aiohttp import web
from pymessenger.bot import Bot
from pymessenger import Button

import requests
import json
import re
import hashlib
import dataset
from datetime import datetime, timedelta
from random import randint
import datetime
from data import *
import os
ACCESS_TOKEN = 'EAAn7SZBdU3fABAAXaHsyWBlZBwYHSevsZAQ7V6erT0CDrn5t5ZATiPXiHl76pTrZBYAaBhkXTd3iBSwibEifqN9kFq3Ak92gMKhS6qUdw6C1F4YkUqiPgfJE7QZCN7m6bZApU4XwP9960YUKZAtMgG0qoAw37tAkZA4Gyw8CT4Rn0vp28sY0WcsOj'
VERIFY_TOKEN = 'market'
bot = Bot(ACCESS_TOKEN)
#{"type":"postback","title":"Поиск участников","payload":"find"}
app = Flask(__name__)
#user = '3543992779026508'

@app.route('/send', methods=['GET', 'POST'])
def send_message():
    user = gdt()['id']
    print(user)
    send_info(user, "Активный звонок",new,main_menu)
    return 'ok'


@app.route('/', methods=['GET', 'POST'])
def receive_message():
    if request.method == 'GET':
        if request.args.get("hub.verify_token") == VERIFY_TOKEN:
            return request.args.get("hub.challenge")
        else:
            return 'Invalid verification token'
    else:
        output = request.get_json()
        print(output)
        for event in output['entry']:
            print(event)
            if 'messaging' in event:
                messaging = event['messaging']
                for message in messaging:
                    print(message)
                    recipient_id = message['sender']['id']
                    if message.get('postback'):
                        if message['postback'].get('title'):
                            if message['postback'].get('title') == 'Get Started':
                                send_info(recipient_id, "Добро пожаловать в админку сервиса 'Консультант онлайн'",[],main_menu)
                        if message['postback']['payload'] == 'emotion':
                            button_upgrade(recipient_id, 'По настроению')
                            carousel_emotion1(recipient_id)
                        elif 'next_state_' in message['postback']['payload']:
                            s = message['postback']['payload'].split('_')
                            carousel(recipient_id,s[2],int(s[3]),int(s[4])+1)
                    if message.get('message'):
                        recipient_id = message['sender']['id']
                        if message['message'].get('text'):
                            if message['message'].get('text') == 'Начать':
                                file = open('data.txt', 'w')
                                file.write("{'id':'"+recipient_id+"'}")
                                file.close()
                                send_info(recipient_id, "Добро пожаловать в админку сервиса 'Консультант онлайн'",[],main_menu)
                            elif message['message'].get('text') == 'Закрыть все сессии':
                                requests.get('https://haclever.moscow/close')
                                send_info(recipient_id, "Сессии успешно закрыты",[],main_menu)
                        if message['message'].get('quick_reply'):
                            if message['message']['quick_reply'].get('payload'):
                                if message['message']['quick_reply'].get('payload') == 'winter':
                                    print('winter messaging')
            if 'standby' in event:
                messaging = event['standby']
                for message in messaging:
                    if message.get('message'):
                        recipient_id = message['sender']['id']
                        if message['message'].get('text'):
                            if message['message'].get('text') == 'Начать':
                                file = open('data.txt', 'w')
                                file.write("{'id':'"+recipient_id+"'}")
                                file.close()
                                send_info(recipient_id, "Добро пожаловать в админку сервиса 'Консультант онлайн'",[],main_menu)
                            elif message['message'].get('text') == 'Закрыть все сессии':
                                requests.get('https://haclever.moscow/close')
                                send_info(recipient_id, "Сессии успешно закрыты",[],main_menu)
                            
                        if message['message'].get('quick_reply'):
                            if message['message']['quick_reply'].get('payload'):
                                if message['message']['quick_reply'].get('payload') == 'winter':
                                    print('winter standby')
                    if message.get('postback'):
                        recipient_id = message['sender']['id']
                        if message['postback'].get('title'):
                            if message['postback'].get('title') == 'Get Started':
                                response_sent_text = get_message()
                                send_quick(recipient_id, response_sent_text)
        return 'OK'
    return "Message Processed"

def verify_fb_token(token_sent):
    if token_sent == VERIFY_TOKEN:
        print("ff")
        return token_sent
    return 'Invalid verification token'

def get_message():
    sample_responses = ["You are stunning!", "We're proud of you.", "Keep on being you!", "We're greatful to know you :)"]
    return random.choice(sample_responses)

def send_message(recipient_id, response):
    bot.send_text_message(recipient_id, response)
    return "success"


def send_info(recipient_id, response, btns ,rep=None):
    if rep == None:
        rep = main_menu
    if btns == []:
        payload = {
                'recipient': {
                    'id': recipient_id
                },
                'message': {
                "text": response,
                "quick_replies": rep
            }
        }
    else:    
        payload = {
                    'recipient': {
                        'id': recipient_id
                    },
                    'message': {
                    "attachment":{
                        "type":"template",
                        "payload":{
                            "template_type":"button",
                            "text":response,
                            "buttons": btns
                      }
                    },
                    "quick_replies": rep
                }
            }
    resp = bot.send_raw(payload)
    print(resp)
    return "success"



def send_random(recipient_id):
    elements = [{  
                        "title": temp[0][0],
                        "subtitle":temp[0][2],
                        "image_url":temp[0][3],
                        "buttons": [
                          {
                            "type": "web_url",
                            "title": "Ознакомиться с книгой",
                            "url":temp[0][1],
                          }
                        ]
                      }]
    payload = {
                'recipient': {
                    'id': recipient_id
                },
                "message":{
                    "attachment": {
                "type": "template",
                "payload": {
                  "template_type": "generic",
                  "elements": elements
                }
              },
              "quick_replies": main_menu,
            }
        }
    resp = bot.send_raw(payload)
    print(resp)
    return "success"
'''if __name__ == "__main__":
    app = web.Application()
    app.router.add_post("/", receive_message)
    app.router.add_post("/api/message", api)
    app.router.add_get("/", receive_message)
    web.run_app(app, host='0.0.0.0', port=8081)


'''

def gdt():
    file = open('data.txt', 'r')
    data = eval(file.read())
    file.close()
    return data

if __name__ == "__main__":
    app.run(debug=True, port=8081, host='0.0.0.0')
'''
https://wav-library.net/sounds/0-0-1-5349-20
,
                          {
                            "type": "web_url",
                            "title": "Аудио",
                            "url":'http://95.217.22.130:8001/audio/'+book['path_audio'],
                          }

                          curl -X POST -H "Content-Type: application/json" -d '{"recipient":{"id":""},"target_app_id":371291917550,"metadata":"String to pass to secondary receiver app"}' "https://graph.facebook.com/v2.6/me/pass_thread_control?access_token=EAAL1JTXpmJYBAFLCbWgfofq1IYOROUME7xZA4aRTYXPbcWR6d3m6um1BhEnMxgYWP9e5Sp4XucSooFYwe7985GWE56uZAh2Ep65RZCPU2lKC56ks0CdkmZCa7PLdBRIQwsNvkG2jAvnp2zZAWPB6CStv5lq2Pqu5hM8ivSIWy6NV2wn0ymzQH"
                          payload = {"recipient": {"id": "359612234765682"},"target_app_id": "371291917550","metadata": "ok"}
r = requests.post('https://graph.facebook.com/v2.6/me/pass_thread_control?access_token=EAAL1JTXpmJYBAFLCbWgfofq1IYOROUME7xZA4aRTYXPbcWR6d3m6um1BhEnMxgYWP9e5Sp4XucSooFYwe7985GWE56uZAh2Ep65RZCPU2lKC56ks0CdkmZCa7PLdBRIQwsNvkG2jAvnp2zZAWPB6CStv5lq2Pqu5hM8ivSIWy6NV2wn0ymzQH',data=json.dumps(payload),headers={'Content-Type': 'application/json'})
'''