<script>
	import NewYearTree from './NewYearTree.svelte';

	const nyDate = new Date('2021-01-01T00:00:00');
	let currentDate = new Date();
	let diff = nyDate - currentDate;
	setInterval(() => {
		currentDate = new Date();
		diff = nyDate - currentDate;
	}, 200);

	$: days = Math.floor(diff / (1000 * 3600 * 24 ));
	$: hours = Math.floor((diff % (1000 * 3600 * 24)) / (1000 * 3600)).toString().padStart(2, '0');
	$: minutes = Math.floor((diff % (1000 * 3600)) / (1000 * 60)).toString().padStart(2, '0');
	$: seconds = Math.floor((diff % (1000 * 60)) / 1000).toString().padStart(2, '0');

	let element;
	let startCoords;
	let elementCoords;
	let shiftX;
	let shiftY;

	function onDragStart(event) {
		element = event.target;
		const rect = element.getBoundingClientRect();
		const img = new Image();
		event.dataTransfer.setDragImage(img, 0, 0);
		shiftX = event.clientX - rect.left;
		shiftY = event.clientY - rect.top;
		element.style.position = 'absolute';
		move(event);
		return false;
	}

	function move(event) {
		element.style.left = event.clientX - shiftX + 'px';
		element.style.top = event.clientY - shiftY + 'px';
	}

	function onDrag(event) {
		move(event);
	}

	function onDragEnd(event) {
		move(event);
	}

</script>

<svelte:head>
	<title>New Year Countdown</title>
	<link href="https://fonts.googleapis.com/css2?family=Charm:wght@400;700&display=swap" rel="stylesheet">
</svelte:head>


<main>
	<div class="snowflakes-container">
		<div class="svg-container"
			draggable="true"
			on:dragstart={onDragStart}
			on:drag={onDrag}
			on:dragend={onDragEnd}
		>
			<svg class="snowflake" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 35.8 35.8">
				<path id="a" d="M33.212 26.16l-3.054-1.764 1.84-1.062a.504.504 0 00.184-.684.502.502 0 00-.684-.183L29.16 23.82l-2.32-1.34 4.729-2.73a.502.502 0 
					00-.5-.867l-5.23 3.019-3.619-2.09 4.352-1.918-4.354-1.919 3.619-2.091 5.231 3.021a.504.504 0 00.685-.183.498.498 0 00-.184-.683l-4.731-2.732 
					2.32-1.34L31.5 13.32a.504.504 0 00.685-.184.498.498 0 00-.184-.682L30.16 11.39l3.052-1.762a.503.503 0 00.184-.684.503.503 0 00-.684-.184l-3.051 
					1.763-.001-2.122a.5.5 0 00-1 0l.001 2.699-2.32 1.34.001-5.46a.5.5 0 00-1 0l-.001 6.037-3.619 2.09.515-4.728-3.838 2.81V9.008l5.229-3.021a.504.504 
					0 00.184-.684.502.502 0 00-.684-.182l-4.729 2.73V5.173l2.339-1.352a.5.5 0 10-.5-.866L18.399 4.02V.5a.5.5 0 00-1 0v3.523L15.56 2.961a.502.502 0 
					00-.5.868l2.339 1.352v2.678l-4.729-2.73a.502.502 0 00-.5.868l5.229 3.02v4.184l-3.837-2.811.514 4.729-3.621-2.092V6.989a.5.5 0 00-1 
					0v5.462l-2.318-1.34-.001-2.701a.5.5 0 10-1 0l.001 2.125-3.053-1.764a.5.5 0 00-.5.867L5.636 11.4l-1.839 1.062a.501.501 0 00.501.868l2.339-1.351 2.319 
					1.339-4.729 2.73a.501.501 0 00.501.868l5.23-3.021 3.622 2.091-4.352 1.919 4.351 1.919-3.621 2.09-5.231-3.018a.497.497 0 00-.683.184.504.504 0 00.183.686l4.731 
					2.729-2.321 1.34-2.338-1.352a.502.502 0 00-.5.868l1.838 1.062-3.05 1.76a.501.501 0 00.501.869l3.051-1.763.001 2.121a.5.5 0 001 0l-.001-2.701 2.322-1.34-.002 
					5.463a.5.5 0 101 0l.002-6.041 3.619-2.09-.514 4.729 3.837-2.81v4.183l-5.228 3.021a.5.5 0 00.5.868l4.728-2.73v2.679l-2.339 1.353a.5.5 0 
					00.5.868l1.839-1.062v3.51c0 .274.224.5.5.5s.5-.226.5-.5v-3.524l1.841 1.062a.502.502 0 00.685-.184.5.5 0 00-.184-.684l-2.341-1.354v-2.678l4.729 2.73a.502.502 
					0 00.685-.184.5.5 0 00-.184-.684l-5.229-3.021V22.6l3.838 2.811-.514-4.729 3.62 2.09v6.039a.5.5 0 001 0V23.35l2.318 1.34.001 2.699c0 
					.275.225.5.5.5s.5-.225.5-.5l-.001-2.123 3.053 1.764a.503.503 0 00.685-.184.51.51 0 00-.193-.686zm-12.215-2.901l-2.6-1.901-.499-.363-.501.365-2.598 
					1.9.348-3.201.067-.615-.567-.25-2.945-1.299 2.946-1.299.566-.25-.067-.616-.348-3.2 2.598 1.901.5.364.5-.365 2.6-1.901-.349 3.201-.066.616.564.249 2.946 
					1.3-2.944 1.299-.566.25.066.615.349 3.2z"/>
			</svg>
		</div>
		<div class="svg-container"
			draggable="true"
			on:dragstart={onDragStart}
			on:drag={onDrag}
			on:dragend={onDragEnd}
		>
			<svg class="snowflake" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 35.8 35.8">
				<use xlink:href="#a"/>
			</svg>
		</div>
		<div class="svg-container"
			draggable="true"
			on:dragstart={onDragStart}
			on:drag={onDrag}
			on:dragend={onDragEnd}
		>
			<svg class="snowflake" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 35.8 35.8">
				<use xlink:href="#a"/>
			</svg>
		</div>
	</div>

	<svg class="top-star" xmlns:svg="http://www.w3.org/2000/svg"
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 210 297"
	>
		<path d="m 156.29221,49.271953 -47.94022,84.101327 -4.56459,-43.01133 -3.31764,40.44043 -44.178169,-81.35266 37.91398,85.95031 -32.18926,-17.41393 29.90516,26.27489 -86.9223394,4.41678 84.7483094,4.17132 -26.62473,22.21156 31.84766,-15.44815 -41.26259,88.11555 47.951069,-84.11941 4.34134,40.90241 3.19413,-38.93302 44.51405,81.97225 -39.07874,-88.592 33.14112,17.92862 -27.60554,-24.25382 84.83566,-4.31085 -87.35642,-4.29948 29.01992,-24.2104 -30.28291,14.68902 z" />
	</svg>

	<h1>New Year Countdown!</h1>
	<div class="timer">
		{days} days {hours}:{minutes}:{seconds}
	</div>

	<div class="tree-container">
		<NewYearTree />
	</div>

</main>


<style type="text/scss">
	$snowflakeWidth: 70px;

	main {
		padding: 10px;
		max-width: 240px;
		margin: 10% auto;
		text-align: center;
		font-size: 5vh;
		font-family: 'Charm', cursive;
		color: #ff3e00;
	}

	h1 {
		font-size: 5vh;
		font-weight: 100;
		text-transform: uppercase;
	}

	.svg-container {
		display: inline;
	}

	.snowflakes-container {
		height: 80px;
	}

	.timer {
		font-size: 7vh;
		font-weight: bold;
		text-transform: uppercase;
		word-spacing: 0.3em;
	}

	.snowflake {
		width: $snowflakeWidth;
		fill: rgb(68, 119, 189);
		transform-origin: 50% 50%;
		animation: rotate 3s infinite;
	}

	.top-star {
		width: 40px;
		position: absolute;
		top: 5px;
		right: 10px;
		transform-origin: 50% 50%;
		animation: flick 3s infinite;
		fill: #ff0042;
	}

	.tree-container {
		width: 265px;
		margin: 0 auto;
	}

	@keyframes rotate {
		50% {
			transform: rotate(60deg);
		}
	}

	@keyframes flick {
		50% {
			transform: scale(1.4);
		}
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>