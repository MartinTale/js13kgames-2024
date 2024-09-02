import { coffeeButton, discordButton, gameContainer, soundToggle } from "..";
import { createButton } from "../components/button/button";
import { el, mount, setTextContent } from "../helpers/dom";
import { mathRandomInteger, toTime } from "../helpers/numbers";
import { shuffle } from "../helpers/objects";
import { easings, fadeIn, fadeOut, swingDown, swingUp, tween, tweens } from "../systems/animation";
import { emojis } from "../systems/emojis";
import { playSound, sounds } from "../systems/music";
import { saveState, state } from "../systems/state";
import "./game.css";

const gameTitle = el("h1.game-title", "Game Title");
const topSpeedTitle = el("h2", "Top Speeds");
const topSpeedContainer = el("div.top-speeds");
let startGameButton;
const gameButtonContainer = el("div.game-buttons");
const gameInfo = el("b.game-info", "Avoid items that have 13 of them!");
const timeDisplay = el("b.game-time");
const roundPlacement = el("div.round-placement");
const lostGame = el("div.lost-game");
const wonGame = el("div.won-game");
const roundLabel = el("b.round-label", "beat 4 rounds to win");

export function initGame() {
	startGameButton = createButton(
		"Start Game",
		() => {
			startGame();
		},
		"primary",
		"start-game-button",
	);

	mount(gameContainer, gameTitle);
	mount(gameContainer, topSpeedContainer);
	mount(gameContainer, startGameButton);
	mount(gameContainer, gameButtonContainer);
	mount(gameContainer, gameInfo);
	mount(gameContainer, timeDisplay);
	mount(gameContainer, roundPlacement);
	mount(gameContainer, lostGame);
	mount(gameContainer, wonGame);
	mount(gameContainer, roundLabel);

	showTitleScreen();
}

function showTitleScreen() {
	const hasTopSpeeds = state.topSpeeds.value.length > 0;

	topSpeedContainer.style.opacity = "0";
	startGameButton.style.opacity = "0";
	startGameButton.style.pointerEvents = "all";
	[discordButton, coffeeButton, soundToggle].forEach((item) => {
		item.root.style.opacity = "0";
		item.root.style.pointerEvents = "all";
	});

	updateTopSpeeds(state.topSpeeds.value);

	swingUp(gameTitle);

	setTimeout(() => {
		if (hasTopSpeeds) {
			swingUp(topSpeedContainer);
		} else {
			swingUp(startGameButton, {
				onComplete: () => {
					startGameButton.style.transform = "";
				},
			});
		}
	}, 250);

	setTimeout(() => {
		if (hasTopSpeeds) {
			swingUp(startGameButton, {
				onComplete: () => {
					startGameButton.style.transform = "";
				},
			});
		}
	}, 500);

	setTimeout(() => {
		[discordButton, coffeeButton].forEach((item) => {
			fadeIn(item.root, {
				onComplete: () => {
					item.root.style.transform = "";
				},
			});
		});
		fadeIn(soundToggle.root, {
			to: { opacity: state.sound.value === true ? 1 : 0.4 },
			onComplete: () => {
				soundToggle.root.style.transform = "";
			},
		});

		if (!hasTopSpeeds) {
			fadeIn(roundLabel);
		}
	}, 1000);
}

function hideTitleScreen() {
	const hasTopSpeeds = state.topSpeeds.value.length > 0;

	startGameButton.style.pointerEvents = "none";
	[discordButton, coffeeButton, soundToggle].forEach((item) => {
		item.root.style.pointerEvents = "none";
	});

	swingDown(startGameButton);

	[discordButton, coffeeButton].forEach((item) => {
		fadeOut(item.root);
	});
	fadeOut(soundToggle.root, { from: { opacity: state.sound.value === true ? 1 : 0.4 } });

	if (!hasTopSpeeds) {
		fadeOut(roundLabel);
	}

	setTimeout(() => {
		if (hasTopSpeeds) {
			swingDown(topSpeedContainer);
		} else {
			swingDown(gameTitle);
		}
	}, 150);

	setTimeout(() => {
		if (hasTopSpeeds) {
			swingDown(gameTitle);
		}
	}, 300);
}

function startRound(level: number) {
	// roundPlacement.innerHTML = "";
	// mount(roundPlacement, el("b.round-number", level.toString() + " / 4"));

	// swingUp(roundPlacement, {
	// 	onComplete: () => {
	// 		setTimeout(() => {
	// 			swingDown(roundPlacement, {
	// 				onComplete: () => {
	// 					openLevel(level);
	// 				},
	// 			});
	// 		}, 500);
	// 	},
	// });

	setTimeout(() => {
		openLevel(level);
	}, 500);
}

function closeLevel(level: number, won: boolean) {
	gameIcons.forEach((icon) => {
		tween(icon, {
			from: { opacity: 1, scale: 1.5 },
			to: { opacity: 0, scale: 0 },
			duration: 500,
			easing: easings.swingFrom,
			onComplete: () => {
				icon.remove();
			},
		});
	});

	setTimeout(() => {
		tween(gameButtons[2], {
			from: { y: 0 },
			to: { y: 500 },
			onComplete: () => {
				gameButtons[2].remove();
			},
			easing: easings.swingFrom,
			duration: 750,
		});
		setTimeout(() => {
			[gameButtons[1], gameButtons[3]].forEach((button) => {
				tween(button, {
					from: { y: 0 },
					to: { y: 500 },
					onComplete: () => {
						button.remove();
					},
					easing: easings.swingFrom,
					duration: 750,
				});
			});
		}, 75);
		setTimeout(() => {
			[gameButtons[0], gameButtons[4]].forEach((button) => {
				tween(button, {
					from: { y: 0 },
					to: { y: 500 },
					onComplete: () => {
						button.remove();
					},
					easing: easings.swingFrom,
					duration: 750,
				});
			});
		}, 150);

		setTimeout(() => {
			if (level === 4 && won) {
				showWonGameScreen();
			} else if (won) {
				startRound(level + 1);
			} else {
				showLoseGameScreen();
			}
		}, 750);
	}, 500);
}

function showWonGameScreen() {
	playSound(sounds.win);

	wonGame.innerHTML = "";
	mount(wonGame, el("h2", "You won!"));

	const currentTime = Date.now() - startTime;
	const lowestTime = state.topSpeeds.value.length > 0 ? Math.min(...state.topSpeeds.value) : 31536000000;
	if (lowestTime > currentTime) {
		mount(wonGame, el("b", "New top speed!"));
	}
	mount(wonGame, el("b", toTime(currentTime)));
	state.topSpeeds.value = [...state.topSpeeds.value, currentTime];
	state.topSpeeds.value.sort((a, b) => a - b);
	state.topSpeeds.value = state.topSpeeds.value.slice(0, 5);

	saveState();

	fadeOut(timeDisplay);

	swingUp(wonGame, {
		onComplete: () => {
			setTimeout(() => {
				swingDown(wonGame, {
					onComplete: () => {
						setTimeout(() => {
							showTitleScreen();
						}, 500);
					},
				});
			}, 1500);
		},
	});
}

function showLoseGameScreen() {
	playSound(sounds.loss);
	lostGame.innerHTML = "";
	mount(lostGame, el("h2", "Game Over!"));
	mount(
		lostGame,
		el(
			"b",
			["Better luck next time!", "Try again!", "Maybe next time!", "Maths are hard!", "13 is bad!"][
				mathRandomInteger(0, 4)
			],
		),
	);
	fadeOut(timeDisplay);
	swingUp(lostGame, {
		onComplete: () => {
			setTimeout(() => {
				swingDown(lostGame, {
					onComplete: () => {
						setTimeout(() => {
							showTitleScreen();
						}, 500);
					},
				});
			}, 1000);
		},
	});
}

const itemCountsPerLevel = [
	[4, 5],
	[6, 7],
	[8, 9],
	[10, 11],
];

let gameButtons: HTMLElement[] = [];
let gameButtonCounters: HTMLElement[] = [];
let gameIcons: HTMLElement[] = [];
let gameIconCounts: number[] = [];
let startTime = Date.now();

function openLevel(level: number) {
	if (level === 1) {
		startTime = Date.now();
	}

	gameIcons = [];
	gameButtons = [];
	gameIconCounts = [];
	gameButtonCounters = [];
	const icons: string[] = [];

	const availableIcons = [0, 1, 2, 3, 4];
	const wrongIcons = availableIcons.splice(mathRandomInteger(0, availableIcons.length - 1), 1);

	for (let i = 0; i < level - 1; i += 1) {
		wrongIcons.push(availableIcons.splice(mathRandomInteger(0, availableIcons.length - 1), 1)[0]);
	}

	const emojisInCategory = [...emojis[mathRandomInteger(0, emojis.length - 1)]];
	for (let i = 0; i < 5; i += 1) {
		icons.push(emojisInCategory.splice(mathRandomInteger(0, emojisInCategory.length - 1), 1)[0]);
	}

	for (let i = 0; i < 5; i += 1) {
		const gameButtonCount: HTMLElement = el("b.game-button-counter", "0");
		gameButtonCounters.push(gameButtonCount);

		gameButtons.push(
			createButton(
				[el("b.button-icon", icons[i]), gameButtonCount],
				() => {
					fadeOut(gameInfo);

					gameButtons.forEach((button, index) => {
						button.style.pointerEvents = "none";

						if (index === i) {
							tween(button, {
								to: {
									scale: 1.2,
								},
								duration: 500,
								easing: easings.swingTo,
							});
						} else {
							tween(button, {
								to: {
									scale: 0.75,
									opacity: 0.5,
								},
								duration: 500,
								easing: easings.swingTo,
							});
						}

						if (wrongIcons.includes(index)) {
							setTimeout(() => {
								button.classList.add("danger");
							}, 300);
						}
					});

					gameIcons.forEach((icon) => {
						if (icon.textContent !== icons[i]) {
							setTimeout(
								() => {
									tween(icon, {
										to: {
											opacity: 0,
											scale: 0.5,
										},
										duration: 500,
										easing: easings.easeFromTo,
										onComplete: () => {
											icon.remove();
										},
									});
								},
								mathRandomInteger(50, 250),
							);
						} else {
							setTimeout(
								() => {
									tween(icon, {
										to: {
											scale: 1.5,
										},
										duration: 500,
										easing: easings.swingTo,
									});
								},
								mathRandomInteger(50, 250),
							);
						}
					});

					gameButtonCounters.forEach((counter, index) => {
						if (wrongIcons.includes(index)) {
							counter.classList.add("wrong");
						}
						setTextContent(counter, gameIconCounts[index].toString());
						swingUp(counter, {
							from: {
								opacity: 0,
								y: 5,
							},
						});
					});

					setTimeout(() => {
						closeLevel(level, wrongIcons.includes(i) === false);
					}, 1500);
				},
				"primary",
				"game-button",
			),
		);

		mount(gameButtonContainer, gameButtons[i]);

		if (wrongIcons.includes(i)) {
			gameIconCounts[i] = 13;
			for (let j = 0; j < 13; j += 1) {
				gameIcons.push(el("div.game-icon", icons[i]));
			}
		} else {
			const numberOfIcons =
				itemCountsPerLevel[level - 1][mathRandomInteger(0, itemCountsPerLevel[level - 1].length - 1)];
			gameIconCounts[i] = numberOfIcons;
			for (let j = 0; j < numberOfIcons; j += 1) {
				gameIcons.push(el("div.game-icon", icons[i]));
			}
		}
	}

	shuffle(gameIcons);

	const availableLocations: number[][] = [];
	for (let i = 0; i < 6; i += 1) {
		for (let j = 0; j < 11; j += 1) {
			availableLocations.push([i * 55 + 20, j * 55 + 50]);
		}
	}
	shuffle(availableLocations);

	// for (let i = 0; i < availableLocations.length; i += 1) {
	// 	const location = el("div.location");
	// 	location.style.left = `${availableLocations[i][0]}px`;
	// 	location.style.top = `${availableLocations[i][1]}px`;
	// 	mount(gameContainer, location);
	// }

	for (let i = 0; i < gameIcons.length; i += 1) {
		mount(gameContainer, gameIcons[i]);

		const location = availableLocations.splice(mathRandomInteger(0, availableLocations.length - 1), 1)[0];
		gameIcons[i].style.left = `${location[0] + mathRandomInteger(0, 20) - 10}px`;
		gameIcons[i].style.top = `${location[1] + mathRandomInteger(0, 20) - 10}px`;

		setTimeout(
			() => {
				tween(gameIcons[i], {
					from: {
						opacity: 0,
						scale: 0,
					},
					to: {
						opacity: 1,
						scale: 1,
					},
					easing: easings.swingTo,
					duration: 400,
				});
			},
			mathRandomInteger(50, 350),
		);
	}

	swingUp(gameButtons[2], {
		onComplete: () => {
			gameButtons[2].style.transform = "";
		},
	});
	setTimeout(() => {
		[gameButtons[1], gameButtons[3]].forEach((button) => {
			swingUp(button, {
				onComplete: () => {
					button.style.transform = "";
				},
			});
		});
	}, 75);
	setTimeout(() => {
		[gameButtons[0], gameButtons[4]].forEach((button) => {
			swingUp(button, {
				onComplete: () => {
					button.style.transform = "";
				},
			});
		});
	}, 150);
	setTimeout(() => {
		fadeIn(gameInfo);
		if (level === 1) {
			fadeIn(timeDisplay);
		}
	}, 300);
}

function updateTopSpeeds(topSpeeds: number[]) {
	topSpeedContainer.innerHTML = "";
	mount(topSpeedContainer, topSpeedTitle);

	for (let i = 0; i < 5; i += 1) {
		const topSpeed = topSpeeds[i];

		let topSpeedElement = el("b");
		if (topSpeed != null) {
			topSpeedElement = el("b", toTime(topSpeed));
		}

		mount(topSpeedContainer, topSpeedElement);
	}
}

function startGame() {
	hideTitleScreen();

	setTimeout(() => {
		startRound(1);
		// showTitleScreen();
	}, 500);
}

export function startGameLoop() {
	processGameState();
}

function processGameState() {
	const newProcessingTime = Date.now();
	// const secondsPassed = (newProcessingTime - state.lastProcessedAt.value) / 1000;

	Object.values(tweens).forEach((updateTween) => updateTween(newProcessingTime));
	// console.log(secondsPassed);

	// state.level.value += secondsPassed;
	setTextContent(timeDisplay, toTime(newProcessingTime - startTime));

	state.lastProcessedAt.value = newProcessingTime;
	requestAnimationFrame(processGameState);
}
