# Devcard - GitHub Profile Visualizer

A reimagined GitHub profile viewer built for the Cloud Computing Cell (AKGEC) frontend task HTML/CSS/JavaScript

### What I Built ?

I built a website where you type in any GitHub username and it shows that persons GitHub profile in a creative visual way instead of just showing plain text and numbers. 
It draws charts and cards to make the data easy to understand at a glance. The app fetches real, live data directly from GitHubs official API -nothing is hardcoded or fake.

## What it shows?<br> 

->Profile info - avatar, name, bio, location, followers/following count<br>
->A pie chart showing which programming languages the person codes in most<br>
->Their top 6 repositories as cards, showing stars, forks, and description<br>
->A compare mode to look up two GitHub users side by side<br>
->A dark/light theme switch<br>

## Technologies Used <br>

->Technology -   What its for <br>
->HTML	        -        The structure/skeleton of the page <br>
->CSS    	        -       Styling-colors, layout, animations <br>
->JavaScript  - The logic fetching data, building the charts, handling errors <br>

## Features Implemented

1)Live search <br>
2)Hand built chart <br>
3)Error handling <br>
4)Compare mode <br>
5)Dark/light theme toggle <br>
6)Responsive design - works on mobile, tablet and desktop screens



## Now the most important part of the project is Challenges Faced by me during building this project


**1) Building a chart without a library:**
  The hardest part was drawing the donut chart myself using raw SVG instead of an easy library like Chart.js <br>
I had to learn how a circle outline can be turned into a colored slice using math converting each languages percentage into an arc length along the circle

**2) Handling Githubs API limits:**
 GitHub only allows 60 requests per hour without logging in If I called the API too many times (like checking every single repo's exact language breakdown) the app would get blocked. <br>
I solved this by only fetching detailed data for the top 8 most-starred repos and using each repo basic primary language label as a fallback for the rest - so the app stays useful without hitting the limit.

**3) Handling errors gracefully:**
A username that doesn't exist an account with 0 repos and a slow or failed network request all needed to be handled differently without the page ever going blank or crashing<br>
I had to write separate logic to detect and respond to each of these situations clearly

**4) Learning git/github workflow:**
 Since I'm still learning JavaScript deeply working with git add, commit, push and resolving a merge conflict when pushing updates was a new experience I had to figure out step by step



## Additonal notes:
I highly recommend checking out the "Challenges Faced" section in the project description to understand the development journey the obstacles encountered and the solutions implemented throughout the project.
