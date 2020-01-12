'use strict'; 

const puppeteer = require('puppeteer');
const ig = require('./insta');

let options = {
    username: '**username**', 
    password: '**password**',
 
    followWaitTime: 100
};

(async() => { 
    let browser;
    let page;
    try {
        browser = await puppeteer.launch({ headless: false });
        page = await browser.newPage();
        options.page = page;
        const instabot = await ig(browser, options);

        // Initialize connection and login
        await instabot.login();

        // Follow users that have followed you
        await instabot.followUsersActivity();
    
        // Follow specified users
        let users = ["prattprattpratt", "michaelbjordan"];
        for (let user of users) {
            await instabot.navigateToUser(user);
            await instabot.followCurrentUser();
        }

        // Like given number of posts from tags
        let tags = ["soccer", "vacation"];
        await instabot.likeTags(3, tags);

        // Comment on given number of posts in feed
        let comments = ["hey", "love this post!", "keep up the good work :)"];
        await instabot.commentFeed(3, comments);

        // Comment on specific users most recent post
        await instabot.navigateToUser(users[0]);
        await instabot.commentUser(comments);
        

        // Follow users that follow following
        let usersToFollowFollowers = ["prattprattpratt", "michaelbjordan"];
        for (let user of usersToFollowFollowers) {
            await instabot.navigateToUser(user);
            await instabot.navigateFollowOrFollowing('following');
            await instabot.followUsersFollowing(3);
        }  
   
    } catch (error) {
        console.log(error);
    } finally {
        console.log('Closing browser.');
        await browser.close();
    }
})();
