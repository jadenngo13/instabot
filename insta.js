'use strict';  

const puppeteer = require('puppeteer');
const tagUrl = (tag) => `https://www.instagram.com/explore/tags/${tag}/`;

const selectors = {
    loginBtn: '//div[contains(text(), "Log In")]',
    userInput: 'input[name="username"]',
    passInput: 'input[name="password"]',
    profileIcon: 'a > svg[aria-label="Profile"]',
    followBtn: '//button[text()="Follow"]',
    unFollowBtn: '//button[text()="Unfollow"]',
    followingBtn: '//button[text()="Following"]',
    togglePostNotifs: '//button[contains(text(), "Not Now")]',
    searchBar: 'input[placeholder="Search"]',
    activityFeedIcon: 'a > svg[aria-label="Activity Feed"]',
    likeBtn: 'span[aria-label="Like"]',
    postBtn: '//button[text()="Post"]',
    closeBtn: '//button[contains(text(), "Close")]'
};

module.exports = async(browser, options) => { 
 
    const {
        instaUrl = 'https://instagram.com/',
        page,

        username,
        password,

        followWaitTime = 100
    } = options;

    // Initialize connection and browser
    async function login() {
        await page.goto(instaUrl, { waitUntil: 'networkidle2' });
        let loginBtn = await page.$x(selectors.loginBtn);

        // Click login button url
        await loginBtn[0].click();
        await page.waitFor(1000);

        // Enter user and password information
        await page.type(selectors.userInput, username, { delay: 50 }); //add delay so username is not simply pasted in, but rather slowly entered
        await page.type(selectors.passInput, password, { delay: 50 });
       
        // Click login button
        loginBtn = await page.$x(selectors.loginBtn);
        await loginBtn[0].click();
        await page.waitFor(2000);

        // Check to see if profile icon is available, if it is, means login successful
        await page.waitFor(selectors.profileIcon);

        // Turn off notifications (automatically brought up whenever bot logs in)
        let postNotif = await page.$x(selectors.togglePostNotifs);
        await postNotif[0].click();
    };

    // Navigate to specific user via search bar
    async function navigateToUser(user) {
        // Type in username into search bar
        await page.type(selectors.searchBar, user, { delay: 100 });
        await page.waitFor(1000);

        // Click on corresponding user
        let userBtn = await page.$(`a[href="/${user}/"]`);
        if (userBtn) {
            await userBtn.click();
            await page.waitFor(1000);
            return true;
        } else {
            console.error('Could not find user');
            return false;
        }
    };

    async function navigateProfile() {
        // Set path to profile page
        let profileBtn = await page.$(selectors.profileIcon);
        if (profileBtn) {
            await page.waitFor(1000);
            await page.click(selectors.profileIcon);
            await page.waitFor(1000);
        }
    };

    // Navigate to 'followers' from profile (assumes path is set to profile page)
    async function navigateFollowOrFollowing(type) {
        let followBtn;
        if (type === 'followers') {
            followBtn = await page.$('ul > li:nth-child(2) > a');
        } else if (type === 'following') {
            followBtn = await page.$('ul > li:nth-child(3) > a');
        } else {
            throw new Error('Not valid type of button');
        }

        if (followBtn) {
            await followBtn.click();
            await page.waitFor(1000);
        } else {
            throw new Error('Could not find follow btn');
        }
    };

    // Follow user page is currently on
    async function followCurrentUser() {
        // Follow user
        let followBtn = await page.$x(selectors.followBtn);
        if (followBtn[0]) {
            await page.waitFor(1000);
            await followBtn[0].click();
        }
        await page.waitFor(1000);
    };

    // Unfollow user page is currently on
    async function unFollowCurrentUser() {
        // Unfollow user
        let followingBtn = await page.$x(selectors.followingBtn);
        if (!followingBtn[0]) throw Error('Could not find following button');

        await page.waitFor(1000);
      
        let unFollowBtn = await page.$x(selectors.unFollowBtn);
        await page.waitFor(1000);
        await unFollowBtn[0].click();
    };

    // Follow users that have followed you
    async function followUsersActivity() {
        // Follow users via 'Activity Feed' search
        let heartBtn = await page.$(selectors.activityFeedIcon);
        if (heartBtn) {
            await page.waitFor(1000);
            await page.click(selectors.activityFeedIcon);
        }

        await page.waitFor(1000);
        let followBtns = await page.$x(selectors.followBtn); 
        
        // Loop through every follow request and follow account back
        for (let i = 0; i < followBtns.length; i++) {
            let btn = followBtns[i];
           // await btn.click();
            await page.waitFor(1000);   
        } 
        await page.click(selectors.activityFeedIcon);
    };
    
     // Follow users following (assumes path at profile)
     async function followUsersFollowing(numFollows = 3) {
        // Follow given number of users
        let followBtns = await page.$x(selectors.followBtn);
        let i = 0;
        for (let j = 0; j < numFollows; j++) {
            await followBtns[j].click();
            await page.waitFor(1000);
            // Retrieve follow buttons again (prevents circular-json error)
            followBtns = await page.$x(selectors.followBtn);
            i++;
        }
        let exitBtn = await page.$$('button');
        await exitBtn[2].click();
    };

    // Like posts based on searched tags
    async function likeTags(num, tags) {
        for (let tag of tags) {
            // Go to tag page
            let result = await page.goto(tagUrl(tag), { waitUntil: 'networkidle2' });
            if (!result) throw new Error('Could not find tag');
            await page.waitFor(1000);

            // Get images
            let posts = await page.$$('article > div:nth-child(3) img[decoding="auto"]');
            
            for (let i = 0; i < num; i++) {
                let post = posts[i];

                // Click on post
                await post.click();
                await page.waitFor('body[style="overflow: hidden;"]');
                await page.waitFor(3000);

                // Like post
                let likeBtn = await page.$(selectors.likeBtn);
                if (likeBtn) {
                    await page.click(selectors.likeBtn);
                }
                await page.waitFor(1000);

                // Click out of post
                let exitBtn = await page.$x(selectors.closeBtn;
                await exitBtn[0].click();
                await page.waitFor(1000);
            }
            await page.waitFor(1000);
        }
    };

    // Comment on given number of posts in home feed
    async function commentFeed(num, comments) {
        // Reset path to home feed
        let home = await page.$('img[alt="Instagram"]');
        await home.click();

        // Select all text areas (comment boxes)
        await page.waitForSelector('textarea');
        await page.waitFor(2000);
        let commentBoxes = await page.$$('textarea');
        let postBtns = await page.$x(selectors.postBtn);
        console.log('commeentboxes: ' + commentBoxes.length);

        // Loop through each box and insert random comment
        let len = num < commentBoxes.length ? num : commentBoxes.length;
        for (let i = 0; i < len; i++) {
            // Generate random comment from comments
            let index = Math.floor(Math.random() * comments.length);
            let com = comments[index];

            // Enter comment into box and submit
            let box = commentBoxes[i];
            await box.focus();
            await page.keyboard.type(com, { delay: 100 });
            await postBtns[i].click();
            await page.waitFor(1000);
        }
    };

    // Comment on most recent post by current user
    async function commentUser(comments) {
        // Click on most recent post
        let img = await page.$('article > div:nth-child(1) img[decoding="auto"]');
        await img.click();

        // Generate/enter random comment
        let index = Math.floor(Math.random() * comments.length);
        let com = comments[index];

        // Select comment box
        await page.waitForSelector('textarea');
        let commentBox = await page.$('textarea');
        let postBtn = await page.$x(selectors.postBtn);
        await page.waitFor(1000);

        // Type comment and post
        await commentBox.focus();
        await page.keyboard.type(com, { delay: 100 });
        await postBtn[0].click();
        await page.waitFor(1000);
    };

    return {
        login,
        navigateToUser,
        navigateProfile,
        navigateFollowOrFollowing,
        followCurrentUser,
        unFollowCurrentUser,
        likeTags,
        followUsersActivity,
        followUsersFollowing,
        commentFeed,
        commentUser
    };
};