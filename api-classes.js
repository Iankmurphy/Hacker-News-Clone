const BASE_URL = 'https://hack-or-snooze-v3.herokuapp.com';

/**
 * This class maintains the list of individual Story instances
 *  It also has some methods for fetching, adding, and removing stories
 */

class StoryList {
	constructor(stories) {
		this.stories = stories;
	}

	/**
   * This method is designed to be called to generate a new StoryList.
   *  It:
   *  - calls the API
   *  - builds an array of Story instances
   *  - makes a single StoryList instance out of that
   *  - returns the StoryList instance.*
   */

	static async getStories() {
		// query the /stories endpoint (no auth required)
		const response = await axios.get(`${BASE_URL}/stories`);

		// turn the plain old story objects from the API into instances of the Story class
		const stories = response.data.stories.map((story) => new Story(story));

		// build an instance of our own class using the new array of stories
		return new StoryList(stories);
	}

	/**
   * Method to make a POST request to /stories and add the new story to the list
   * - user - the current instance of User who will post the story
   * - newStory - a new story object for the API with title, author, and url
   *
   * Returns the new story object
   */

	async addStory(user, { title, author, url }) {
		const token = user.loginToken;
		const res = await axios.post(`${BASE_URL}/stories`, { token, story: { title, author, url } });
		const story = new Story(res.data.story);
		this.stories.unshift(story);
		user.ownStories.unshift(story);
		return story;
	}

	async removeStory(user, storyId) {
		const token = user.loginToken;
		await axios({ url: `${BASE_URL}/stories/${storyId}`, method: 'DELETE', data: { token: user.loginToken } });
		this.stories = this.stories.filter((story) => story.storyId !== storyId);
		user.ownStories = user.ownStories.filter((s) => s.storyId !== storyId);
		user.favorites = user.favorites.filter((s) => s.storyId !== storyId);
	}
}

/**
 * The User class to primarily represent the current user.
 *  There are helper methods to signup (create), login, and getLoggedInUser
 */

class User {
	constructor({ username, name, createdAt, updatedAt, favorites = [], ownStories = [] }, token) {
		this.username = username;
		this.name = name;
		this.createdAt = createdAt;
		this.updatedAt = updatedAt;

		// these are all set to defaults, not passed in by the constructor
		this.favorites = favorites.map((s) => new Story(s));
		this.ownStories = ownStories.map((s) => new Story(s));
		this.loginToken = token;
	}

	/* Create and return a new user.
   *
   * Makes POST request to API and returns newly-created user.
   *
   * - username: a new username
   * - password: a new password
   * - name: the user's full name
   */

	static async create(username, password, name) {
		const response = await axios.post(`${BASE_URL}/signup`, { user: { username, password, name } });

		if (!response.data || !response.data.user) throw new Error('No user structure');

		// build a new User instance from the API response
		currentUser = new User(response.data.user, response.data.token);
		// attach the token to the newUser instance for convenience

		return currentUser;
	}

	/* Login in user and return user instance.

   * - username: an existing user's username
   * - password: an existing user's password
   */

	static async login(username, password) {
		const response = await axios.post(`${BASE_URL}/login`, { user: { username, password } });

		currentUser = new User(response.data.user, response.data.token);

		// build a new User instance from the API response
		return currentUser;
	}

	/** Get user instance for the logged-in-user.
   *
   * This function uses the token & username to make an API request to get details
   *   about the user. Then it creates an instance of user with that info.
   */

	static async getLoggedInUser(token, username) {
		// if we don't have user info, return null
		try {
			// call the API
			const response = await axios({ url: `${BASE_URL}/users/${username}`, method: 'GET', params: { token } });

			// instantiate the user from the API information
			return new User(response.data.user, token);
		} catch (err) {
			console.error('getLoggedInUser failed', err);
			return null;
		}
	}

	async addFavorite(story) {
		this.favorites.push(story);
		await this.addorRemoveFavorite('add', story);
	}

	async removeFavorite(story) {
		this.favorites = this.favorites.filter((s) => s.storyId !== story.storyId);
		await this.addorRemoveFavorite('remove', story);
	}

	async addorRemoveFavorite(newState, story) {
		const method = newState === 'add' ? 'POST' : 'DELETE';
		const token = this.loginToken;
		await axios({
			url: `${BASE_URL}/users/${this.username}/favorites/${story.storyId}`,
			method: method,
			data: { token }
		});
	}

	isFavorite(story) {
		return this.favorites.some((s) => s.storyId === story.storyId);
	}
}

/**
 * Class to represent a single story.
 */

class Story {
	/**
   * The constructor is designed to take an object for better readability / flexibility
   * - storyObj: an object that has story properties in it
   */

	constructor({ title, author, url, username, storyId, createdAt, updatedAt }) {
		this.author = author;
		this.title = title;
		this.url = url;
		this.username = username;
		this.storyId = storyId;
		this.createdAt = createdAt;
		this.updatedAt = updatedAt;
	}
}
