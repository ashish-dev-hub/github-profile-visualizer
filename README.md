# Devcard - GitHub Profile Visualizer

A reimagined GitHub profile viewer built for the Cloud Computing Cell (AKGEC) frontend task
plain HTML, CSS, JavaScript 

**Project Name: Devcard - GitHub Profile Visualizer**

What I Built?

I built a website where you type in any GitHub username and it shows that person's GitHub profile in a creative visual way instead of just showing plain text and numbers. 
It draws charts and cards to make the data easy to understand at a glance. The app fetches real, live data directly from GitHub's official API -nothing is hardcoded or fake.

**What it shows:**
->Profile info - avatar, name, bio, location, followers/following count
->A pie chart showing which programming languages the person codes in most
->Their top 6 repositories as cards, showing stars, forks, and description
->A compare mode to look up two GitHub users side by side
->A dark/light theme switch

**Technologies Used:**
Technology -   What it's for
->HTML	        -        The structure/skeleton of the page
->CSS    	        -       Styling-colors, layout, animations
->JavaScript      -       The logic fetching data, building the charts, handling errors
->GitHub REST API   -   	The source of all the real data (profile, repos, languages)

**Features Implemented:**
1)Live search
2)Hand built chart
3)Error handling
4)Compare mode
5)Dark/light theme toggle
6)Responsive design - works on mobile, tablet and desktop screens

**Now the most important part of the project is Challenges Faced by me during building this project:**

1) Building a chart without a library->
The hardest part was drawing the donut chart myself using raw SVG instead of an easy library like Chart.js
I had to learn how a circle outline can be turned into a colored slice using math converting each languages percentage into an arc length along the circle

2) Handling Githubs API limits->
GitHub only allows 60 requests per hour without logging in If I called the API too many times (like checking every single repo's exact language breakdown) the app would get blocked.
I solved this by only fetching detailed data for the top 8 most-starred repos and using each repo basic primary language label as a fallback for the rest - so the app stays useful without hitting the limit.

3) Handling errors gracefully->
A username that doesn't exist an account with 0 repos and a slow or failed network request all needed to be handled differently without the page ever going blank or crashing.
I had to write separate logic to detect and respond to each of these situations clearly.

4) Learning git/github workflow ->
Since I'm still learning JavaScript deeply working with git add, commit, push and resolving a merge conflict when pushing updates was a new experience I had to figure out step by step.


