// cache some selectors we'll be using quite a bit
const body = document.querySelector('body');
const allStoriesList = document.getElementById('all-articles-list');
const favoritedStories = document.getElementById('favorited-articles');
const storiesList = document.querySelectorAll('.articles-list');
const submitForm = document.getElementById('submit-form');
const filteredArticles = document.getElementById('filtered-articles');
const loginForm = document.getElementById('login-form');
const createForm = document.getElementById('create-account-form');
const createAccountForm = document.getElementById('create-account-form');
const ownStories = document.getElementById('my-articles');
const navUserProfile = document.getElementById('nav-user-profile');
const navLogin = document.getElementById('nav-login');
const navLogOut = document.getElementById('nav-logout');
const userProfile = document.getElementById('user-profile');
const navAll = document.getElementById('nav-all');
const navSubmit = document.getElementById('nav-submit-story');
const navFavorites = document.getElementById('nav-favorites');
const navMyStories = document.getElementById('nav-my-stories');
const navWelcome = document.getElementById('nav-welcome');

// global storyList variable
let storyList = null;

// global currentUser variable
let currentUser = null;

async function start() {
	await checkIfLoggedIn();
	await getAndShowStoriesOnStart();
	if (currentUser) updateUIOnUserLogin();
}
start();

async function getAndShowStoriesOnStart() {
	storyList = await StoryList.getStories();
	generateStories();
}

/**
   * Event listener for logging in.
   *  If successfully we will setup the user instance
   */

loginForm.addEventListener('submit', async function(evt) {
	evt.preventDefault(); // no page-refresh on submit

	// grab the username and password
	const username = document.getElementById('login-username').value;
	const password = document.getElementById('login-password').value;

	// call the login static method to build a user instance
	currentUser = await User.login(username, password);
	// set the global user to the user instance
	loginForm.reset();

	syncCurrentUserToLocalStorage();
	loginAndSubmitForm();
});

async function updateUIOnUserLogin() {
	hideElements();
	generateStories();
	allStoriesList.style.display = 'block';
	showNavForLoggedInUser();
	generateUserProfile();
}

function generateUserProfile() {
	document.getElementById('profile-name').innerText = `${currentUser.name}`;
	document.getElementById('profile-username').innerText = `${currentUser.username}`;
	document.getElementById('profile-account-date').innerText = `${currentUser.createdAt.slice(0, 10)}`;
}

/**
   * Event listener for signing up.
   *  If successfully we will setup a new user instance
   */

createAccountForm.addEventListener('submit', async function(evt) {
	evt.preventDefault(); // no page refresh

	// grab the required fields
	const name = document.getElementById('create-account-name').value;
	const username = document.getElementById('create-account-username').value;
	const password = document.getElementById('create-account-password').value;

	// call the create method, which calls the API and then builds a new user instance
	currentUser = await User.create(username, password, name);
	createAccountForm.reset();

	syncCurrentUserToLocalStorage();
	loginAndSubmitForm();
});

/**
   * Log Out Functionality
   */

navLogOut.addEventListener('click', () => {
	// empty out local storage
	localStorage.clear();
	// refresh the page, clearing memory
	location.reload();
});

/**
   * Event Handler for Clicking Login
   */

navLogin.addEventListener('click', () => {
	// Show the Login and Create Account Forms
	hideElements();
	loginForm.style.display = 'block';
	createAccountForm.style.display = 'block';
});

function navAllStories(e) {
	hideElements();
	generateStories();
}

navAll.addEventListener('click', navAllStories);

function navSubmitStoryClick(e) {
	hideElements();
	allStoriesList.style.display = 'block';
	submitForm.style.display = 'block';
}

navSubmit.addEventListener('click', navSubmitStoryClick);

function navFavoritesClick(evt) {
	hideElements();
	putFavListOnPage();
}

navFavorites.addEventListener('click', navFavoritesClick);

function navMyStoriesClick(evt) {
	hideElements();
	putUserStoriesOnPage();
	ownStories.style.display = 'block';
}

navMyStories.addEventListener('click', navMyStoriesClick);

function navProfileClick(e) {
	hideElements();
	userProfile.style.display = 'block';
}

navUserProfile.addEventListener('click', navProfileClick);

/**
   * Event handler for Navigation to Homepage
   */

document.querySelector('#nav-all').addEventListener('click', async function() {
	hideElements();
	await generateStories();
	allStoriesList.style.display = 'block';
});

/**
   * On page load, checks local storage to see if the user is already logged in.
   * Renders page information accordingly.
   */

async function checkIfLoggedIn() {
	// let's see if we're logged in
	const token = localStorage.getItem('token');
	const username = localStorage.getItem('username');
	if (!token || !username) return false;

	// if there is a token in localStorage, call User.getLoggedInUser
	//  to get an instance of User with the right details
	//  this is designed to run once, on page load
	currentUser = await User.getLoggedInUser(token, username);
}

/**
   * A rendering function to run to reset the forms and hide the login info
   */

function loginAndSubmitForm() {
	// hide the forms for logging in and signing up
	loginForm.style.display = 'none';
	createAccountForm.style.display = 'none';

	// reset those forms
	loginForm.reset();
	createAccountForm.reset();

	// show the stories
	allStoriesList.style.display = 'block';

	// update the navigation bar
	showNavForLoggedInUser();
}

/**
   * A rendering function to call the StoryList.getStories static method,
   *  which will generate a storyListInstance. Then render it.
   */

async function generateStories() {
	// empty out that part of the page
	allStoriesList.innerHTML = '';

	// loop through all of our stories and generate HTML for them
	for (let story of storyList.stories) {
		const result = generateStoryHTML(story);
		allStoriesList.appendChild(result);
	}

	allStoriesList.style.display = 'block';
}

/**
   * A function to render HTML for an individual Story instance
   */

function generateStoryHTML(story, user, isFavorite = false, showdeleBtn = false) {
	let hostName = getHostName(story.url);

	// render story markup
	let li = document.createElement('li');
	li.setAttribute('id', `${story.storyId}`);
	if (showdeleBtn === true) {
		let deleBtn = document.createElement('button');
		deleBtn.classList.add('trash-can');
		deleBtn.innerText = 'Delete story';
		deleBtn.addEventListener('click', deleteStory);
		li.appendChild(deleBtn);
	}

	if (user) {
		let span = document.createElement('span');
		let star = document.createElement('i');
		span.classList.add('star');
		if (isFavorite) {
			star.classList.add('fas', 'fa-star');
		} else {
			star.classList.add('far', 'fa-star');
		}
		span.addEventListener('click', toggleStoryFavorite);
		span.appendChild(star);
		li.appendChild(span);
	}
	let a = document.createElement('a');
	a.setAttribute('href', `${story.url}`);
	a.setAttribute('target', 'a blank');
	a.classList.add('article-link');
	a.innerText = `${story.title}`;
	let author = document.createElement('small');
	author.classList.add('article-author');
	author.innerText = `by ${story.author}`;
	let host = document.createElement('small');
	host.classList.add('article-hostname', `${hostName}`);
	host.innerText = `(${hostName})`;
	let username = document.createElement('small');
	username.classList.add('article-username');
	username.innerText = `posted by ${story.username}`;
	li.appendChild(a);
	li.appendChild(author);
	li.appendChild(host);
	li.appendChild(username);

	return li;
}

async function deleteStory(e) {
	const storyId = e.target.parentElement.getAttribute('id');

	await storyList.removeStory(currentUser, storyId);
	await generateStories();
	e.target.parentElement.style.display = 'none';
}

async function submitNewStory(e) {
	e.preventDefault();
	const title = document.getElementById('title').value;
	const author = document.getElementById('author').value;
	const url = document.getElementById('url').value;
	const username = currentUser.username;
	const storyData = { title, url, author, username };
	const story = await storyList.addStory(currentUser, storyData);
	const storymul = generateStoryHTML(story, currentUser, false, true);

	allStoriesList.prepend(storymul);
	submitForm.style.display = 'none';
	submitForm.reset();
}

submitForm.addEventListener('submit', submitNewStory);

function putUserStoriesOnPage() {
	ownStories.innerHTML = '';
	if (currentUser.ownStories.length === 0) {
		let h5 = document.createElement('h5');
		h5.innerText = 'No stories added by user yet.';
		ownStories.appendChild(h5);
	} else {
		for (let story of currentUser.ownStories) {
			let isfav = currentUser.isFavorite(story);
			let stories = generateStoryHTML(story, currentUser, true, isfav);
			ownStories.appendChild(stories);
		}
	}
	ownStories.style.display = 'block';
}

function putFavListOnPage() {
	favoritedStories.innerHTML = '';
	if (currentUser.favorites.length === 0) {
		let h5 = document.createElement('h5');
		h5.innerText = 'No favorites added.';
		favoritedStories.appendChild(h5);
	} else {
		for (let story of currentUser.favorites) {
			const storiesmult = generateStoryHTML(story, currentUser);
			favoritedStories.appendChild(storiesmult);
		}
	}
	favoritedStories.style.display = 'block';
}

async function toggleStoryFavorite(e) {
	// I had a problem with this below line, it was not able to get the id from the li for some reason. I had to link jQuery and use it to get the li id.
	//const storyId = e.target.parentElement.hasAttribute('id');
	const $tgt = $(e.target);
	const $closestLi = $tgt.closest('li');
	const storyId = $closestLi.attr('id');
	console.log(storyId);
	const story = storyList.stories.find((s) => s.storyId === storyId);
	console.log(story);
	if (e.target.classList.contains('fas')) {
		await currentUser.removeFavorite(story);
		e.target.classList.replace('fas', 'far');
	} else {
		await currentUser.addFavorite(story);
		e.target.classList.replace('far', 'fas');
	}
}

/* hide all elements in elementsArr */

function hideElements() {
	const elementsArr = [
		submitForm,
		allStoriesList,
		filteredArticles,
		ownStories,
		loginForm,
		createAccountForm,
		userProfile,
		favoritedStories
	];
	elementsArr.forEach((elem) => (elem.style.display = 'none'));
}

function showNavForLoggedInUser() {
	navWelcome.style.display = 'block';
	navLogin.style.display = 'none';
	navLogOut.style.display = 'block';
	navUserProfile.innerText = `${currentUser.username}`;
	navUserProfile.style.display = 'block';
}

/* simple function to pull the hostname from a URL */

function getHostName(url) {
	let hostName;
	if (url.indexOf('://') > -1) {
		hostName = url.split('/')[2];
	} else {
		hostName = url.split('/')[0];
	}
	if (hostName.slice(0, 4) === 'www.') {
		hostName = hostName.slice(4);
	}
	return hostName;
}

/* sync current user information to localStorage */

function syncCurrentUserToLocalStorage() {
	if (currentUser) {
		localStorage.setItem('token', currentUser.loginToken);
		localStorage.setItem('username', currentUser.username);
	}
}
