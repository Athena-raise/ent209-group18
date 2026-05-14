import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  ArrowLeft,
  Bandage,
  Bike,
  Cable,
  ChevronDown,
  Circle,
  CircleDot,
  Disc,
  Dumbbell,
  HeartPulse,
  Home,
  PersonStanding,
  RefreshCcw,
  StretchHorizontal,
  User,
  Waves,
  Weight,
  type LucideIcon,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import type { BiologicalSex } from "../../store";
import { getExerciseCategories, searchExercises, type ExerciseCategory, type ExerciseItem } from "../lib/exerciseApi";
import muscleFemaleBack from "../assets/muscle-female-back-transparent.png";
import muscleFemaleFront from "../assets/muscle-female-front-transparent.png";
import muscleMaleBack from "../assets/muscle-male-back-transparent.png";
import muscleMaleFront from "../assets/muscle-male-front-transparent.png";

type MuscleSide = "front" | "back";
type MuscleSex = "male" | "female";

interface MuscleRegion {
  id: string;
  name: string;
  side: MuscleSide;
  d: string;
}

interface MuscleFigureConfig {
  imageSrc: string;
  width: number;
  height: number;
  regions: MuscleRegion[];
  seeds: Array<{ id: string; x: number; y: number }>;
}

const maleFrontRegions: MuscleRegion[] = [
  { id: "front-left-traps", name: "Left Trapezius", side: "front", d: "M330 225 C348 212 369 212 388 225 L374 252 C351 248 329 259 304 289 C311 262 320 239 330 225Z" },
  { id: "front-right-traps", name: "Right Trapezius", side: "front", d: "M447 225 C466 212 487 212 505 225 C515 239 524 262 531 289 C506 259 484 248 461 252Z" },
  { id: "front-left-shoulder", name: "Left Shoulder", side: "front", d: "M241 336 C265 273 325 232 388 252 C352 301 316 351 253 370Z" },
  { id: "front-right-shoulder", name: "Right Shoulder", side: "front", d: "M447 252 C511 232 569 276 594 337 C584 359 571 369 553 363 C508 347 476 301 447 252Z" },
  { id: "front-left-chest", name: "Left Chest", side: "front", d: "M280 357 C329 265 425 242 430 325 C434 382 399 428 323 418 C294 414 272 394 280 357Z" },
  { id: "front-right-chest", name: "Right Chest", side: "front", d: "M405 325 C410 242 506 265 555 357 C563 394 541 414 512 418 C436 428 401 382 405 325Z" },
  { id: "front-abs", name: "Abs", side: "front", d: "M354 411 C383 389 452 389 481 411 C493 511 481 603 417 686 C353 603 342 511 354 411Z" },
  { id: "front-left-oblique", name: "Left Obliques", side: "front", d: "M276 407 C304 427 337 426 357 412 C331 528 347 628 401 705 C337 671 290 555 276 407Z" },
  { id: "front-right-oblique", name: "Right Obliques", side: "front", d: "M559 407 C545 555 498 671 434 705 C488 628 504 528 478 412 C498 426 531 427 559 407Z" },
  { id: "front-left-biceps", name: "Left Biceps", side: "front", d: "M218 369 C274 351 304 384 303 444 C286 505 235 533 204 503 C190 453 194 405 218 369Z" },
  { id: "front-right-biceps", name: "Right Biceps", side: "front", d: "M617 369 C641 405 645 453 631 503 C600 533 549 505 532 444 C531 384 561 351 617 369Z" },
  { id: "front-left-forearm", name: "Left Forearm", side: "front", d: "M128 600 C156 530 203 462 252 410 C266 431 281 444 304 448 C286 525 236 630 151 727 C111 705 108 664 128 600Z" },
  { id: "front-right-forearm", name: "Right Forearm", side: "front", d: "M707 600 C727 664 724 705 684 727 C599 630 549 525 531 448 C554 444 569 431 583 410 C632 462 679 530 707 600Z" },
  { id: "front-left-quad", name: "Left Quadriceps", side: "front", d: "M291 673 C352 699 395 801 390 935 C362 1030 314 1068 272 1017 C237 888 243 748 291 673Z" },
  { id: "front-right-quad", name: "Right Quadriceps", side: "front", d: "M544 673 C592 748 598 888 563 1017 C521 1068 473 1030 445 935 C440 801 483 699 544 673Z" },
  { id: "front-left-adductor", name: "Left Adductors", side: "front", d: "M386 678 C417 760 420 853 411 955 C390 1023 374 1072 344 1094 C340 932 343 778 386 678Z" },
  { id: "front-right-adductor", name: "Right Adductors", side: "front", d: "M449 678 C492 778 495 932 491 1094 C461 1072 445 1023 424 955 C415 853 418 760 449 678Z" },
  { id: "front-left-calf", name: "Left Calf", side: "front", d: "M293 1004 C348 1006 371 1078 360 1192 C337 1270 303 1300 265 1256 C251 1152 260 1054 293 1004Z" },
  { id: "front-right-calf", name: "Right Calf", side: "front", d: "M542 1004 C575 1054 584 1152 570 1256 C532 1300 498 1270 475 1192 C464 1078 487 1006 542 1004Z" },
];

const femaleFrontRegions: MuscleRegion[] = [
  { id: "front-left-traps", name: "Left Trapezius", side: "front", d: "M289 219 C321 202 356 205 389 226 L374 252 C333 245 296 262 255 305 C264 268 276 236 289 219Z" },
  { id: "front-right-traps", name: "Right Trapezius", side: "front", d: "M388 226 C421 205 456 202 488 219 C501 236 513 268 522 305 C481 262 444 245 403 252Z" },
  { id: "front-left-shoulder", name: "Left Shoulder", side: "front", d: "M174 347 C198 287 244 241 323 244 C302 269 263 309 212 374 C198 380 185 371 174 347Z" },
  { id: "front-right-shoulder", name: "Right Shoulder", side: "front", d: "M454 244 C533 241 579 287 603 347 C592 371 579 380 565 374 C514 309 475 269 454 244Z" },
  { id: "front-left-chest", name: "Left Chest", side: "front", d: "M211 357 C246 306 293 255 350 254 C379 257 394 274 394 306 L394 329 C391 360 365 376 319 380 C271 383 234 374 211 357Z" },
  { id: "front-right-chest", name: "Right Chest", side: "front", d: "M383 306 C383 274 398 257 427 254 C484 255 531 306 566 357 C543 374 506 383 458 380 C412 376 386 360 383 329Z" },
  { id: "front-abs", name: "Abs", side: "front", d: "M343 381 C352 366 372 355 389 358 C406 355 425 366 434 381 C451 446 449 521 432 583 C421 624 405 665 389 688 C372 665 356 624 345 583 C328 521 326 446 343 381Z" },
  { id: "front-left-oblique", name: "Left Obliques", side: "front", d: "M286 381 C309 397 327 402 344 385 C331 448 333 526 348 584 C361 634 378 672 388 690 C332 655 289 560 286 381Z" },
  { id: "front-right-oblique", name: "Right Obliques", side: "front", d: "M491 381 C488 560 445 655 389 690 C399 672 416 634 429 584 C444 526 446 448 433 385 C450 402 468 397 491 381Z" },
  { id: "front-left-biceps", name: "Left Biceps", side: "front", d: "M184 377 C221 327 278 315 288 361 C292 401 260 463 213 493 C184 506 169 489 169 455 C170 426 174 399 184 377Z" },
  { id: "front-right-biceps", name: "Right Biceps", side: "front", d: "M593 377 C603 399 607 426 608 455 C608 489 593 506 564 493 C517 463 485 401 489 361 C499 315 556 327 593 377Z" },
  { id: "front-left-forearm", name: "Left Forearm", side: "front", d: "M112 544 C133 497 160 455 185 421 C197 453 214 478 236 493 C208 550 165 620 112 682 C86 670 83 638 99 602 C107 582 104 562 112 544Z" },
  { id: "front-right-forearm", name: "Right Forearm", side: "front", d: "M665 544 C673 562 670 582 678 602 C694 638 691 670 665 682 C612 620 569 550 541 493 C563 478 580 453 592 421 C617 455 644 497 665 544Z" },
  { id: "front-left-quad", name: "Left Quadriceps", side: "front", d: "M274 654 C317 680 355 779 362 920 C355 1002 321 1073 291 1061 C252 1023 235 758 274 654Z" },
  { id: "front-right-quad", name: "Right Quadriceps", side: "front", d: "M503 654 C542 758 525 1023 486 1061 C456 1073 422 1002 415 920 C422 779 460 680 503 654Z" },
  { id: "front-left-adductor", name: "Left Adductors", side: "front", d: "M365 669 C385 709 389 782 389 870 C378 954 350 1032 322 1075 C326 927 332 759 365 669Z" },
  { id: "front-right-adductor", name: "Right Adductors", side: "front", d: "M412 669 C445 759 451 927 455 1075 C427 1032 399 954 388 870 C388 782 392 709 412 669Z" },
  { id: "front-left-calf", name: "Left Calf", side: "front", d: "M264 1017 C302 1041 322 1041 344 1012 C350 1085 336 1171 302 1242 C281 1282 245 1266 240 1221 C237 1146 244 1066 264 1017Z" },
  { id: "front-right-calf", name: "Right Calf", side: "front", d: "M513 1017 C533 1066 540 1146 537 1221 C532 1266 496 1282 475 1242 C441 1171 427 1085 433 1012 C455 1041 475 1041 513 1017Z" },
];

const maleBackRegions: MuscleRegion[] = [
  { id: "back-traps", name: "Trapezius", side: "back", d: "M233 249 C303 221 448 221 518 249 L470 318 C411 304 340 304 281 318Z" },
  { id: "back-left-shoulder", name: "Left Rear Shoulder", side: "back", d: "M174 314 C202 254 267 237 322 266 C303 304 271 344 231 368 C207 381 185 374 174 314Z" },
  { id: "back-right-shoulder", name: "Right Rear Shoulder", side: "back", d: "M429 266 C484 237 549 254 577 314 C566 374 544 381 520 368 C480 344 448 304 429 266Z" },
  { id: "back-left-lat", name: "Left Lat", side: "back", d: "M286 321 C338 307 373 335 391 381 C371 514 320 632 271 668 C260 559 223 465 207 380 C233 360 259 340 286 321Z" },
  { id: "back-right-lat", name: "Right Lat", side: "back", d: "M465 321 C492 340 518 360 544 380 C528 465 491 559 480 668 C431 632 380 514 360 381 C378 335 413 307 465 321Z" },
  { id: "back-mid", name: "Mid Back", side: "back", d: "M301 331 C347 310 404 310 450 331 C419 424 398 513 380 615 C367 549 354 484 333 421Z" },
  { id: "back-left-triceps", name: "Left Triceps", side: "back", d: "M153 383 C207 358 246 390 244 451 C227 515 176 545 145 512 C130 461 132 414 153 383Z" },
  { id: "back-right-triceps", name: "Right Triceps", side: "back", d: "M598 383 C619 414 621 461 606 512 C575 545 524 515 507 451 C505 390 544 358 598 383Z" },
  { id: "back-left-forearm", name: "Left Forearm", side: "back", d: "M111 551 C157 566 211 510 243 454 C258 524 211 628 129 726 C91 711 82 665 100 623 C108 598 101 569 111 551Z" },
  { id: "back-right-forearm", name: "Right Forearm", side: "back", d: "M640 551 C650 569 643 598 651 623 C669 665 660 711 622 726 C540 628 493 524 508 454 C540 510 594 566 640 551Z" },
  { id: "back-left-glute", name: "Left Glute", side: "back", d: "M275 629 C337 592 380 633 375 715 C344 771 268 772 232 724 C219 678 235 647 275 629Z" },
  { id: "back-right-glute", name: "Right Glute", side: "back", d: "M476 629 C516 647 532 678 519 724 C483 772 407 771 376 715 C371 633 414 592 476 629Z" },
  { id: "back-left-hamstring", name: "Left Hamstrings", side: "back", d: "M242 724 C290 779 354 757 373 711 C360 849 334 1004 287 1047 C235 1017 220 844 242 724Z" },
  { id: "back-right-hamstring", name: "Right Hamstrings", side: "back", d: "M509 724 C531 844 516 1017 464 1047 C417 1004 391 849 378 711 C397 757 461 779 509 724Z" },
  { id: "back-left-calf", name: "Left Calf", side: "back", d: "M226 1010 C243 982 278 988 294 1017 C303 1045 295 1081 276 1097 C263 1108 253 1098 246 1072 C237 1101 224 1105 214 1089 C202 1067 209 1031 226 1010Z" },
  { id: "back-right-calf", name: "Right Calf", side: "back", d: "M525 1010 C542 1031 549 1067 537 1089 C527 1105 514 1101 505 1072 C498 1098 488 1108 475 1097 C456 1081 448 1045 457 1017 C473 988 508 982 525 1010Z" },
];

const femaleBackRegions: MuscleRegion[] = [
  { id: "back-traps", name: "Trapezius", side: "back", d: "M236 238 C312 205 493 205 569 238 L522 314 C454 298 351 298 283 314Z" },
  { id: "back-left-shoulder", name: "Left Rear Shoulder", side: "back", d: "M196 302 C225 242 299 229 351 261 C313 313 276 363 196 374Z" },
  { id: "back-right-shoulder", name: "Right Rear Shoulder", side: "back", d: "M454 261 C506 229 580 242 609 302 C529 363 492 313 454 261Z" },
  { id: "back-left-lat", name: "Left Lat", side: "back", d: "M312 318 C366 301 398 336 408 405 C383 529 340 613 292 667 C286 560 241 469 232 378 C257 355 284 335 312 318Z" },
  { id: "back-right-lat", name: "Right Lat", side: "back", d: "M493 318 C521 335 548 355 573 378 C564 469 519 560 513 667 C465 613 422 529 397 405 C407 336 439 301 493 318Z" },
  { id: "back-mid", name: "Mid Back", side: "back", d: "M333 316 C385 298 420 298 472 316 C443 420 422 514 407 611 C389 565 373 486 355 419Z" },
  { id: "back-left-triceps", name: "Left Triceps", side: "back", d: "M161 385 C215 351 268 383 265 447 C246 509 186 544 151 512 C135 461 139 416 161 385Z" },
  { id: "back-right-triceps", name: "Right Triceps", side: "back", d: "M644 385 C666 416 670 461 654 512 C619 544 559 509 540 447 C537 383 590 351 644 385Z" },
  { id: "back-left-forearm", name: "Left Forearm", side: "back", d: "M112 543 C159 561 223 500 263 448 C278 514 218 627 130 719 C91 704 82 662 99 617 C109 590 102 562 112 543Z" },
  { id: "back-right-forearm", name: "Right Forearm", side: "back", d: "M693 543 C703 562 696 590 706 617 C723 662 714 704 675 719 C587 627 527 514 542 448 C582 500 646 561 693 543Z" },
  { id: "back-left-glute", name: "Left Glute", side: "back", d: "M296 624 C360 592 402 630 402 719 C368 780 293 789 247 735 C232 681 249 646 296 624Z" },
  { id: "back-right-glute", name: "Right Glute", side: "back", d: "M509 624 C556 646 573 681 558 735 C512 789 437 780 403 719 C403 630 445 592 509 624Z" },
  { id: "back-left-calf", name: "Left Calf", side: "back", d: "M250 1026 C306 1019 338 1084 329 1204 C306 1275 267 1300 231 1259 C219 1150 225 1063 250 1026Z" },
  { id: "back-right-calf", name: "Right Calf", side: "back", d: "M555 1026 C580 1063 586 1150 574 1259 C538 1300 499 1275 476 1204 C467 1084 499 1019 555 1026Z" },
];

const maleFrontSeeds = [
  { id: "front-left-traps", x: 357.5, y: 225 },
  { id: "front-right-traps", x: 495, y: 225 },
  { id: "front-left-shoulder", x: 270, y: 330 },
  { id: "front-right-shoulder", x: 577.5, y: 285 },
  { id: "front-left-chest", x: 350, y: 345 },
  { id: "front-right-chest", x: 485, y: 345 },
  { id: "front-abs", x: 418, y: 505 },
  { id: "front-left-oblique", x: 325, y: 515 },
  { id: "front-right-oblique", x: 510, y: 515 },
  { id: "front-left-biceps", x: 242, y: 430 },
  { id: "front-right-biceps", x: 593, y: 430 },
  { id: "front-left-forearm", x: 178, y: 594 },
  { id: "front-right-forearm", x: 657, y: 594 },
  { id: "front-left-quad", x: 305, y: 835 },
  { id: "front-right-quad", x: 530, y: 835 },
  { id: "front-left-adductor", x: 370, y: 860 },
  { id: "front-right-adductor", x: 465, y: 860 },
  { id: "front-left-calf", x: 300, y: 1135 },
  { id: "front-right-calf", x: 535, y: 1135 },
];

const femaleFrontSeeds = [
  { id: "front-left-traps", x: 337.5, y: 225 },
  { id: "front-right-traps", x: 447.5, y: 225 },
  { id: "front-left-shoulder", x: 255, y: 285 },
  { id: "front-right-shoulder", x: 530, y: 285 },
  { id: "front-left-chest", x: 310, y: 285 },
  { id: "front-right-chest", x: 475, y: 285 },
  { id: "front-abs", x: 365, y: 405 },
  { id: "front-abs", x: 420, y: 405 },
  { id: "front-left-oblique", x: 310, y: 405 },
  { id: "front-right-oblique", x: 475, y: 405 },
  { id: "front-left-biceps", x: 255, y: 345 },
  { id: "front-right-biceps", x: 530, y: 345 },
  { id: "front-left-forearm", x: 145, y: 465 },
  { id: "front-right-forearm", x: 640, y: 465 },
  { id: "front-left-quad", x: 310, y: 645 },
  { id: "front-right-quad", x: 475, y: 645 },
  { id: "front-left-adductor", x: 353, y: 830 },
  { id: "front-right-adductor", x: 424, y: 830 },
  { id: "front-left-calf", x: 310, y: 1005 },
  { id: "front-right-calf", x: 475, y: 1005 },
];

const maleBackSeeds = [
  { id: "back-traps", x: 355, y: 225 },
  { id: "back-left-shoulder", x: 245, y: 285 },
  { id: "back-right-shoulder", x: 520, y: 285 },
  { id: "back-left-lat", x: 300, y: 465 },
  { id: "back-right-lat", x: 465, y: 465 },
  { id: "back-mid", x: 355, y: 285 },
  { id: "back-left-triceps", x: 190, y: 345 },
  { id: "back-right-triceps", x: 520, y: 345 },
  { id: "back-left-forearm", x: 80, y: 525 },
  { id: "back-right-forearm", x: 630, y: 525 },
  { id: "back-left-glute", x: 304, y: 690 },
  { id: "back-right-glute", x: 447, y: 690 },
  { id: "back-left-hamstring", x: 300, y: 765 },
  { id: "back-right-hamstring", x: 465, y: 765 },
  { id: "back-left-calf", x: 245, y: 1005 },
  { id: "back-right-calf", x: 465, y: 1005 },
];

const femaleBackSeeds = [
  { id: "back-traps", x: 365, y: 225 },
  { id: "back-left-shoulder", x: 255, y: 285 },
  { id: "back-right-shoulder", x: 530, y: 285 },
  { id: "back-left-lat", x: 310, y: 345 },
  { id: "back-right-lat", x: 475, y: 345 },
  { id: "back-mid", x: 365, y: 285 },
  { id: "back-left-triceps", x: 255, y: 345 },
  { id: "back-right-triceps", x: 530, y: 345 },
  { id: "back-left-forearm", x: 145, y: 465 },
  { id: "back-right-forearm", x: 640, y: 465 },
  { id: "back-left-glute", x: 325, y: 695 },
  { id: "back-right-glute", x: 480, y: 695 },
  { id: "back-left-calf", x: 255, y: 1005 },
  { id: "back-right-calf", x: 530, y: 1005 },
];

const muscleFigures: Record<MuscleSex, Record<MuscleSide, MuscleFigureConfig>> = {
  male: {
    front: {
      imageSrc: muscleMaleFront,
      width: 835,
      height: 1329,
      regions: maleFrontRegions,
      seeds: maleFrontSeeds,
    },
    back: {
      imageSrc: muscleMaleBack,
      width: 751,
      height: 1311,
      regions: maleBackRegions,
      seeds: maleBackSeeds,
    },
  },
  female: {
    front: {
      imageSrc: muscleFemaleFront,
      width: 777,
      height: 1325,
      regions: femaleFrontRegions,
      seeds: femaleFrontSeeds,
    },
    back: {
      imageSrc: muscleFemaleBack,
      width: 805,
      height: 1304,
      regions: femaleBackRegions,
      seeds: femaleBackSeeds,
    },
  },
};

const prioritizedSeedIds = new Set([
  "front-left-traps",
  "front-right-traps",
  "front-left-shoulder",
  "front-right-shoulder",
  "front-left-forearm",
  "front-right-forearm",
]);

const exerciseTargetByRegionId: Record<string, string> = {
  "front-left-traps": "Traps",
  "front-right-traps": "Traps",
  "back-traps": "Traps",
  "front-left-shoulder": "Shoulders",
  "front-right-shoulder": "Shoulders",
  "back-left-shoulder": "Shoulders",
  "back-right-shoulder": "Shoulders",
  "front-left-chest": "Chest",
  "front-right-chest": "Chest",
  "front-abs": "Abdominals",
  "front-left-oblique": "Obliques",
  "front-right-oblique": "Obliques",
  "front-left-biceps": "Biceps",
  "front-right-biceps": "Biceps",
  "back-left-triceps": "Triceps",
  "back-right-triceps": "Triceps",
  "front-left-forearm": "Forearms",
  "front-right-forearm": "Forearms",
  "back-left-forearm": "Forearms",
  "back-right-forearm": "Forearms",
  "front-left-quad": "Quadriceps",
  "front-right-quad": "Quadriceps",
  "front-left-adductor": "Adductors",
  "front-right-adductor": "Adductors",
  "front-left-calf": "Calves",
  "front-right-calf": "Calves",
  "back-left-calf": "Calves",
  "back-right-calf": "Calves",
  "back-left-lat": "Lats",
  "back-right-lat": "Lats",
  "back-mid": "Middle Back",
  "back-left-glute": "Glutes",
  "back-right-glute": "Glutes",
  "back-left-hamstring": "Hamstrings",
  "back-right-hamstring": "Hamstrings",
};

const fallbackEquipmentCategories: ExerciseCategory[] = [
  { value: "band", label: "Band", count: 113 },
  { value: "barbell", label: "Barbell", count: 202 },
  { value: "bodyweight", label: "Bodyweight", count: 204 },
  { value: "bosu-ball", label: "Bosu-Ball", count: 31 },
  { value: "cables", label: "Cables", count: 161 },
  { value: "cardio", label: "Cardio", count: 48 },
  { value: "dumbbells", label: "Dumbbells", count: 299 },
  { value: "kettlebells", label: "Kettlebells", count: 167 },
  { value: "machine", label: "Machine", count: 89 },
  { value: "medicine-ball", label: "Medicine-Ball", count: 32 },
  { value: "medicineball", label: "Medicineball", count: 3 },
  { value: "pilates", label: "Pilates", count: 49 },
  { value: "plate", label: "Plate", count: 69 },
  { value: "recovery", label: "Recovery", count: 218 },
  { value: "smith-machine", label: "Smith-Machine", count: 34 },
  { value: "stretches", label: "Stretches", count: 52 },
  { value: "trx", label: "TRX", count: 31 },
  { value: "vitruvian", label: "Vitruvian", count: 25 },
  { value: "yoga", label: "Yoga", count: 75 },
];

const equipmentIconByValue: Record<string, LucideIcon> = {
  all: Dumbbell,
  band: StretchHorizontal,
  barbell: Dumbbell,
  bodyweight: PersonStanding,
  "bosu-ball": Circle,
  cables: Cable,
  cardio: HeartPulse,
  dumbbells: Dumbbell,
  kettlebells: Weight,
  machine: Activity,
  "medicine-ball": CircleDot,
  medicineball: CircleDot,
  pilates: User,
  plate: Disc,
  recovery: RefreshCcw,
  "smith-machine": Waves,
  stretches: StretchHorizontal,
  trx: Cable,
  vitruvian: Bike,
  yoga: PersonStanding,
};

interface MuscleMapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sex?: BiologicalSex | null;
  withBottomNav?: boolean;
}

export function MuscleMapModal({ open, onOpenChange, sex, withBottomNav = false }: MuscleMapModalProps) {
  const [selectedId, setSelectedId] = useState<string>("front-abs");
  const [currentView, setCurrentView] = useState<"map" | "equipment" | "results">("map");
  const [mobileSide, setMobileSide] = useState<MuscleSide>("front");
  const [selectedEquipment, setSelectedEquipment] = useState<string>("");
  const [exercises, setExercises] = useState<ExerciseItem[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseItem | null>(null);
  const [isExercisePickerOpen, setIsExercisePickerOpen] = useState(false);
  const [equipmentCategories, setEquipmentCategories] = useState<ExerciseCategory[]>(fallbackEquipmentCategories);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isLoadingExercises, setIsLoadingExercises] = useState(false);
  const [exerciseMessage, setExerciseMessage] = useState("");
  const selectedSex = sex === "female" ? "female" : "male";
  const frontFigure = muscleFigures[selectedSex].front;
  const backFigure = muscleFigures[selectedSex].back;
  const regions = useMemo(() => [...frontFigure.regions, ...backFigure.regions], [frontFigure, backFigure]);
  const selectedMuscle = regions.find((region) => region.id === selectedId) ?? regions[0];
  const exerciseTarget = exerciseTargetByRegionId[selectedMuscle.id] ?? "abs";
  const equipmentOptions = useMemo(
    () => [{ value: "all", label: "All", count: 0 }, ...equipmentCategories],
    [equipmentCategories],
  );
  const selectedEquipmentLabel =
    equipmentOptions.find((option) => option.value === selectedEquipment)?.label ?? "";
  const activeEquipmentLabel = selectedEquipmentLabel || "All Equipment";

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;
    setIsLoadingCategories(true);

    getExerciseCategories()
      .then((categories) => {
        if (!cancelled && categories.length > 0) {
          setEquipmentCategories(categories);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setEquipmentCategories(fallbackEquipmentCategories);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingCategories(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  const handleSelectMuscle = (id: string) => {
    setSelectedId(id);
    setExercises([]);
    setSelectedExercise(null);
    setExerciseMessage("");
    setIsExercisePickerOpen(false);
  };

  const handleLoadExercises = async () => {
    setIsLoadingExercises(true);
    setExerciseMessage("");

    try {
      const results = await searchExercises({
        target: exerciseTarget,
        equipment: selectedEquipment || "all",
        gender: selectedSex,
        limit: selectedEquipment ? 50 : 12,
      });

      setExercises(results);
      setSelectedExercise(results[0] ?? null);
      setIsExercisePickerOpen(false);
      setCurrentView("results");

      if (results.length === 0) {
        setExerciseMessage("No exercises found for this muscle and equipment combination.");
      }
    } catch (error) {
      setExercises([]);
      setSelectedExercise(null);
      setExerciseMessage(error instanceof Error ? error.message : "Unable to load exercises.");
    } finally {
      setIsLoadingExercises(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={!withBottomNav}>
      <DialogContent
        className={
          withBottomNav
            ? "bottom-[80px] top-auto flex h-[calc(100dvh-80px)] max-h-[calc(100dvh-80px)] max-w-md translate-y-0 grid-rows-none flex-col overflow-hidden rounded-none border-0 bg-[#EEF5F8] p-4 shadow-none [&>button:last-child]:hidden sm:bottom-[80px] sm:top-auto sm:h-[calc(100dvh-80px)] sm:max-h-[calc(100dvh-80px)] sm:max-w-md sm:translate-y-0 sm:rounded-none sm:p-4"
            : "bottom-0 top-auto flex h-[100dvh] max-h-[100dvh] max-w-[960px] translate-y-0 grid-rows-none flex-col overflow-hidden rounded-b-none rounded-t-[28px] border border-black/[0.06] bg-[#EEF5F8] p-4 shadow-[0_24px_80px_rgba(15,23,42,0.24)] [&>button:last-child]:hidden sm:top-1/2 sm:bottom-auto sm:h-[92vh] sm:max-h-[92vh] sm:-translate-y-1/2 sm:rounded-[28px] sm:p-7"
        }
      >
        <DialogHeader className="sr-only">
          <DialogTitle className="text-[22px] font-bold tracking-tight text-black">Muscle Map</DialogTitle>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col">
          {currentView === "map" ? (
            <>
              {!withBottomNav ? (
                <div className="mb-1 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    aria-label="Back to home"
                    className="grid h-8 w-8 place-items-center rounded-[12px] bg-white text-[#344054] shadow-[0_6px_16px_rgba(16,24,40,0.05)] transition-colors hover:bg-[#F2F4F7]"
                  >
                    <ArrowLeft aria-hidden="true" className="h-4 w-4" strokeWidth={2.2} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    aria-label="Back to home"
                    className="grid h-8 w-8 place-items-center rounded-[12px] bg-white text-[#344054] shadow-[0_6px_16px_rgba(16,24,40,0.05)] transition-colors hover:bg-[#F2F4F7]"
                  >
                    <Home aria-hidden="true" className="h-4 w-4" strokeWidth={2.2} />
                  </button>
                </div>
              ) : (
                <div className="mb-1 h-8 shrink-0" aria-hidden="true" />
              )}

              <div className="mb-2 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-black/35">Selected Muscle</p>
                <h3 className="mt-0.5 text-[20px] font-bold leading-tight tracking-tight text-black">{selectedMuscle.name}</h3>
              </div>

              <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[24px] bg-[#EAF2F6] px-3 py-2">
                <div className="mx-auto mb-3 grid w-full max-w-[320px] grid-cols-2 gap-2 rounded-[18px] bg-white p-1.5 md:hidden">
                  {([
                    { value: "front", label: "Front" },
                    { value: "back", label: "Back" },
                  ] as const).map((option) => {
                    const selected = mobileSide === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setMobileSide(option.value)}
                        className={`h-10 rounded-[14px] text-[14px] font-semibold transition-colors ${
                          selected
                            ? "bg-[#101828] text-white"
                            : "bg-transparent text-[#344054] hover:bg-[#F2F4F7]"
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>

                <div className="mx-auto flex min-h-0 w-full max-w-[760px] flex-1 items-start justify-center gap-4 md:grid md:grid-cols-2">
                  <div className={mobileSide === "front" ? "h-full min-h-0 w-full" : "hidden h-full min-h-0 w-full md:block"}>
                    <MuscleFigure title="Front" config={frontFigure} selectedId={selectedId} onSelect={handleSelectMuscle} />
                  </div>
                  <div className={mobileSide === "back" ? "h-full min-h-0 w-full" : "hidden h-full min-h-0 w-full md:block"}>
                    <MuscleFigure title="Back" config={backFigure} selectedId={selectedId} onSelect={handleSelectMuscle} />
                  </div>
                </div>

              </div>

              <div className="mt-2 grid gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentView("equipment")}
                  className="w-full rounded-[18px] bg-white px-4 py-2.5 text-[14px] font-semibold text-[#344054] shadow-[0_8px_24px_rgba(0,0,0,0.04)] transition-colors hover:bg-[#F2F4F7]"
                >
                  {selectedEquipmentLabel || "Select Equipment"}
                </button>
                <button
                  type="button"
                  onClick={handleLoadExercises}
                  disabled={isLoadingExercises}
                  className="w-full rounded-[18px] bg-[#101828] px-4 py-2.5 text-[14px] font-semibold text-white shadow-[0_8px_24px_rgba(16,24,40,0.16)] transition-colors hover:bg-[#0c111d] disabled:opacity-60"
                >
                  {isLoadingExercises ? "Loading Exercises" : "Next Step"}
                </button>
              </div>
            </>
          ) : currentView === "results" ? (
            <>
              <div className="mb-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentView("map")}
                  aria-label="Back to muscle map"
                  className="grid h-9 w-9 place-items-center rounded-[14px] bg-white text-[#344054] shadow-[0_6px_16px_rgba(16,24,40,0.05)] transition-colors hover:bg-[#F2F4F7]"
                >
                  <ArrowLeft aria-hidden="true" className="h-4 w-4" strokeWidth={2.2} />
                </button>
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  aria-label="Back to home"
                  className="grid h-9 w-9 place-items-center rounded-[14px] bg-white text-[#344054] shadow-[0_6px_16px_rgba(16,24,40,0.05)] transition-colors hover:bg-[#F2F4F7]"
                >
                  <Home aria-hidden="true" className="h-4 w-4" strokeWidth={2.2} />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto rounded-[24px] bg-white/72 p-1.5 pb-5 shadow-[0_10px_28px_rgba(16,24,40,0.05)]">
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-[16px] bg-[#F7F9FB] px-3 py-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#98A2B3]">Muscle</p>
                    <p className="mt-0.5 text-[14px] font-bold capitalize text-[#101828]">{selectedExercise?.target || selectedMuscle.name}</p>
                  </div>
                  <div className="rounded-[16px] bg-[#F7F9FB] px-3 py-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#98A2B3]">Equipment</p>
                    <p className="mt-0.5 text-[14px] font-bold capitalize text-[#101828]">{selectedExercise?.equipment || activeEquipmentLabel}</p>
                  </div>
                </div>

                <div className="relative z-20 mt-0 rounded-[18px] bg-[#F7F9FB] p-2">
                  <div className="mb-1 flex items-center justify-between px-1">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#667085]">Method</p>
                    <p className="text-[12px] font-bold text-[#98A2B3]">{exercises.length}</p>
                  </div>

                  {exerciseMessage ? (
                    <div className="rounded-[18px] bg-[#FFF6E7] px-4 py-3 text-[13px] font-semibold text-[#9A5B00]">
                      {exerciseMessage}
                    </div>
                  ) : null}

                  {exercises.length > 0 ? (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsExercisePickerOpen((value) => !value)}
                        className="grid w-full grid-cols-[1fr_auto] items-center gap-2 rounded-[16px] bg-white px-3 py-2 text-left text-[#101828] shadow-[0_4px_12px_rgba(16,24,40,0.03)] transition-colors hover:bg-[#F2F6F8]"
                      >
                        <div className="min-w-0">
                          <p className="line-clamp-1 text-[14px] font-bold capitalize leading-tight">{selectedExercise?.name ?? "Select method"}</p>
                        </div>
                        <span className="grid h-8 w-8 place-items-center rounded-full bg-[#EEF4F8] text-[#344054]">
                          <ChevronDown
                            aria-hidden="true"
                            className={`h-4 w-4 transition-transform ${isExercisePickerOpen ? "rotate-180" : ""}`}
                            strokeWidth={2.1}
                          />
                        </span>
                      </button>

                      {isExercisePickerOpen ? (
                        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 max-h-[280px] overflow-y-auto rounded-[20px] bg-white p-2 shadow-[0_18px_40px_rgba(16,24,40,0.18)]">
                          {exercises.map((exercise) => {
                            const selected = selectedExercise?.id === exercise.id;

                            return (
                              <button
                                key={exercise.id}
                                type="button"
                                onClick={() => {
                                  setSelectedExercise(exercise);
                                  setIsExercisePickerOpen(false);
                                }}
                                className={`w-full rounded-[16px] px-3 py-3 text-left transition-colors ${
                                  selected
                                    ? "bg-[#101828] text-white"
                                    : "text-[#101828] hover:bg-[#F2F4F7]"
                                }`}
                                >
                                  <p className="text-[14px] font-bold capitalize leading-tight">{exercise.name}</p>
                              </button>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                {selectedExercise ? (
                  <div className="mt-0.5 grid min-h-0 gap-0.5 xl:grid-cols-[minmax(260px,0.78fr)_1fr]">
                    <div className="grid min-w-0 gap-1">
                      <ExerciseMediaWindow
                        name={selectedExercise.name}
                        videoUrl={selectedExercise.videoUrl}
                        gifUrl={selectedExercise.gifUrl}
                      />
                      <ExerciseMediaWindow
                        name={selectedExercise.name}
                        videoUrl={selectedExercise.secondaryVideoUrl || ""}
                        gifUrl={selectedExercise.secondaryGifUrl || ""}
                      />
                    </div>

                    <div className="min-w-0 rounded-[18px] bg-[#F7F9FB] p-2">
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#667085]">Steps</p>
                      {selectedExercise.instructions.length > 0 ? (
                        <ol className={`mt-1.5 grid ${selectedExercise.instructions.length > 3 ? "gap-0.5" : "gap-2"}`}>
                          {selectedExercise.instructions.map((instruction, index) => (
                            <li
                              key={`${selectedExercise.id}-${index}`}
                              className={`grid grid-cols-[32px_1fr] items-start gap-2 text-[#344054] ${
                                selectedExercise.instructions.length > 3
                                  ? "min-h-[34px] text-[13px] leading-snug"
                                  : "min-h-[48px] text-[14px] leading-relaxed"
                              }`}
                            >
                              <span className="mt-[3px] grid h-[24px] w-[24px] place-items-center justify-self-center rounded-full bg-white text-[12px] font-bold leading-none text-[#101828] shadow-[0_4px_12px_rgba(16,24,40,0.04)]">
                                {index + 1}
                              </span>
                              <span className="pt-0.5">{instruction}</span>
                            </li>
                          ))}
                        </ol>
                      ) : (
                        <p className="mt-3 text-[14px] font-medium text-[#667085]">No written instructions available for this exercise.</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 grid min-h-[260px] place-items-center text-center">
                    <div>
                      <p className="text-[18px] font-bold text-[#101828]">No exercises found</p>
                      <p className="mt-2 text-[14px] font-medium text-[#667085]">Try another equipment option for this muscle.</p>
                      <button
                        type="button"
                        onClick={() => setCurrentView("equipment")}
                        className="mt-4 rounded-[18px] bg-[#101828] px-5 py-3 text-[14px] font-bold text-white"
                      >
                        Change Equipment
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </>
          ) : (
            <>
              <div className="mb-5 text-center">
                <p className="text-[24px] font-bold uppercase tracking-[0.16em] text-black">Equipment</p>
              </div>

              <div className="mx-auto flex min-h-0 w-full max-w-[532px] flex-1 flex-col overflow-hidden rounded-[28px] bg-white/70 p-4 shadow-[0_12px_32px_rgba(16,24,40,0.04)]">
                <div className="shrink-0 pb-3 text-center text-[14px] font-bold text-black/40">
                  {isLoadingCategories ? "Syncing MuscleWiki equipment" : `${equipmentCategories.length} types of equipment`}
                </div>
                <div className="grid min-h-0 flex-1 auto-rows-[88px] grid-cols-2 content-start gap-3 overflow-y-auto pb-1 pr-2">
                  {equipmentOptions.map((option) => {
                    const selected = selectedEquipment === option.value || (!selectedEquipment && option.value === "all");
                    const EquipmentIcon = equipmentIconByValue[option.value] ?? Bandage;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setSelectedEquipment(option.value === "all" ? "" : option.value);
                          setExercises([]);
                          setSelectedExercise(null);
                          setExerciseMessage("");
                          setCurrentView("map");
                        }}
                        className={`grid grid-rows-[1fr_auto] rounded-[18px] px-4 py-3 text-left transition-colors ${
                          selected
                            ? "bg-[#101828] text-white"
                            : "bg-white text-[#101828] hover:bg-[#F2F4F7]"
                        }`}
                      >
                        <p className="min-w-0 break-words text-[15px] font-bold leading-tight">{option.label}</p>
                        <div className="mt-2 grid grid-cols-[1fr_32px] items-center gap-2">
                          <p className={`min-w-0 text-left text-[12px] leading-snug ${selected ? "text-white/60" : "text-[#667085]"}`}>
                            {option.value === "all"
                              ? "All exercises"
                              : `${option.count.toLocaleString()} exercises`}
                          </p>
                          <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-[10px] ${selected ? "bg-white/12 text-white" : "bg-[#EEF4F8] text-[#1F3B8F]"}`}>
                            <EquipmentIcon aria-hidden="true" className="h-4 w-4" strokeWidth={1.9} />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mx-auto mt-4 grid w-full max-w-[532px] grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setCurrentView("map")}
                  className="h-16 rounded-[24px] bg-white px-4 text-[16px] font-bold text-[#344054] shadow-[0_10px_28px_rgba(16,24,40,0.05)] transition-colors hover:bg-[#F2F4F7]"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedEquipment("");
                    setExercises([]);
                    setSelectedExercise(null);
                    setExerciseMessage("");
                    setCurrentView("map");
                  }}
                  className="h-16 rounded-[24px] bg-[#101828] px-4 text-[16px] font-bold text-white shadow-[0_12px_30px_rgba(16,24,40,0.18)] transition-colors hover:bg-[#0c111d]"
                >
                  All Equipment
                </button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MuscleFigure({
  title,
  config,
  selectedId,
  onSelect,
}: {
  title: string;
  config: MuscleFigureConfig;
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const imageRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const regionMapRef = useRef<Int16Array | null>(null);

  useEffect(() => {
    const image = imageRef.current;
    const canvas = canvasRef.current;

    if (!image || !canvas) {
      return;
    }

    let cancelled = false;

    const buildRegions = () => {
      if (cancelled || !image.complete || image.naturalWidth === 0) {
        return;
      }

      const width = config.width;
      const height = config.height;
      const sourceCanvas = document.createElement("canvas");
      sourceCanvas.width = width;
      sourceCanvas.height = height;
      const sourceContext = sourceCanvas.getContext("2d", { willReadFrequently: true });
      const overlayContext = canvas.getContext("2d");

      if (!sourceContext || !overlayContext) {
        return;
      }

      canvas.width = width;
      canvas.height = height;
      sourceContext.drawImage(image, 0, 0, width, height);
      const pixels = sourceContext.getImageData(0, 0, width, height).data;
      const barriers = detectLineBarriers(pixels, width, height);
      const selectableMask = buildSelectableMask(barriers, width, height);
      const regionMap = buildRegionMap(barriers, selectableMask, width, height, config.seeds);
      regionMapRef.current = regionMap;
      paintSelectedRegion(canvas, regionMap, config, selectedId);
    };

    if (image.complete) {
      buildRegions();
    } else {
      image.addEventListener("load", buildRegions, { once: true });
    }

    return () => {
      cancelled = true;
      image.removeEventListener("load", buildRegions);
    };
  }, [config]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const regionMap = regionMapRef.current;

    if (canvas && regionMap) {
      paintSelectedRegion(canvas, regionMap, config, selectedId);
    }
  }, [config, selectedId]);

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const regionMap = regionMapRef.current;

    if (!canvas || !regionMap) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(((event.clientX - rect.left) / rect.width) * config.width);
    const y = Math.floor(((event.clientY - rect.top) / rect.height) * config.height);
    const regionIndex = regionMap[y * config.width + x];

  if (regionIndex >= 0) {
      onSelect(config.seeds[regionIndex].id);
      return;
    }
  };
  return (
    <div className="relative flex h-full min-h-0 justify-center overflow-hidden rounded-[20px] bg-[#EAF2F6] px-2 pb-2 pt-10 md:h-full md:min-h-0 md:pt-10">
      <p className="absolute left-4 top-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#4A4D68]/60">{title}</p>
      <div
        className="relative h-full max-h-full max-w-full"
        style={{ aspectRatio: `${config.width} / ${config.height}` }}
      >
        <img
          ref={imageRef}
          src={config.imageSrc}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full select-none object-contain"
          draggable={false}
        />
        <canvas
          ref={canvasRef}
          role="button"
          aria-label={`${title} muscle map`}
          tabIndex={0}
          onClick={handleCanvasClick}
          className="absolute inset-0 h-full w-full cursor-pointer"
        />
      </div>
    </div>
  );
}

function ExerciseMediaWindow({
  name,
  videoUrl,
  gifUrl,
}: {
  name: string;
  videoUrl: string;
  gifUrl: string;
}) {
  return (
    <div className="overflow-hidden rounded-[18px] bg-[#EEF4F8] p-1.5">
      {videoUrl ? (
        <video
          src={videoUrl}
          className="mx-auto aspect-video w-full rounded-[14px] bg-white object-contain"
          controls
          playsInline
          preload="metadata"
        />
      ) : gifUrl ? (
        <img
          src={gifUrl}
          alt={name}
          className="mx-auto aspect-video w-full rounded-[14px] bg-white object-contain"
        />
      ) : (
        <div className="grid aspect-video place-items-center rounded-[14px] bg-white text-[12px] font-bold text-[#667085]">
          No media available
        </div>
      )}
    </div>
  );
}

function detectLineBarriers(pixels: Uint8ClampedArray, width: number, height: number) {
  const barriers = new Uint8Array(width * height);

  for (let index = 0; index < width * height; index += 1) {
    const pixelIndex = index * 4;
    const red = pixels[pixelIndex];
    const green = pixels[pixelIndex + 1];
    const blue = pixels[pixelIndex + 2];
    const alpha = pixels[pixelIndex + 3];
    const luminance = red * 0.299 + green * 0.587 + blue * 0.114;

    if (alpha > 20 && luminance < 185 && blue > red * 0.82) {
      barriers[index] = 1;
    }
  }

  const dilated = new Uint8Array(barriers);

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const index = y * width + x;

      if (barriers[index]) {
        for (let offsetY = -2; offsetY <= 2; offsetY += 1) {
          for (let offsetX = -2; offsetX <= 2; offsetX += 1) {
            const nextX = x + offsetX;
            const nextY = y + offsetY;

            if (nextX >= 0 && nextX < width && nextY >= 0 && nextY < height) {
              dilated[nextY * width + nextX] = 1;
            }
          }
        }
      }
    }
  }

  return dilated;
}

function buildSelectableMask(barriers: Uint8Array, width: number, height: number) {
  const outside = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let head = 0;
  let tail = 0;

  const enqueue = (index: number) => {
    if (index < 0 || index >= outside.length || outside[index] || barriers[index]) {
      return;
    }

    outside[index] = 1;
    queue[tail] = index;
    tail += 1;
  };

  for (let x = 0; x < width; x += 1) {
    enqueue(x);
    enqueue((height - 1) * width + x);
  }

  for (let y = 0; y < height; y += 1) {
    enqueue(y * width);
    enqueue(y * width + width - 1);
  }

  while (head < tail) {
    const current = queue[head];
    head += 1;
    const x = current % width;
    const y = Math.floor(current / width);

    if (x > 0) enqueue(current - 1);
    if (x < width - 1) enqueue(current + 1);
    if (y > 0) enqueue(current - width);
    if (y < height - 1) enqueue(current + width);
  }

  const selectable = new Uint8Array(width * height);

  for (let index = 0; index < selectable.length; index += 1) {
    if (!barriers[index] && !outside[index]) {
      selectable[index] = 1;
    }
  }

  return selectable;
}

function buildRegionMap(
  barriers: Uint8Array,
  bodyMask: Uint8Array,
  width: number,
  height: number,
  seeds: Array<{ id: string; x: number; y: number }>,
) {
  const regionMap = new Int16Array(width * height);
  regionMap.fill(-1);
  const queue = new Int32Array(width * height);
  const orderedSeeds = [...seeds].sort((a, b) => {
    const aPriority = prioritizedSeedIds.has(a.id) ? 0 : 1;
    const bPriority = prioritizedSeedIds.has(b.id) ? 0 : 1;

    return aPriority - bPriority;
  });
  orderedSeeds.forEach((seed) => {
    const seedIndex = seeds.indexOf(seed);

    if (seedIndex < 0) {
      return;
    }

    const startIndex = findNearestSelectableIndex(seed.x, seed.y, bodyMask, regionMap, width, height);

    if (startIndex === -1 || barriers[startIndex] || !bodyMask[startIndex] || regionMap[startIndex] !== -1) {
      return;
    }

    let head = 0;
    let tail = 0;
    queue[tail] = startIndex;
    tail += 1;
    regionMap[startIndex] = seedIndex;

    while (head < tail) {
      const current = queue[head];
      head += 1;
      const x = current % width;
      const y = Math.floor(current / width);
      const neighbors = [
        current - 1,
        current + 1,
        current - width,
        current + width,
      ];

      for (const next of neighbors) {
        if (next < 0 || next >= regionMap.length) {
          continue;
        }

        const nextX = next % width;
        const nextY = Math.floor(next / width);

        if (Math.abs(nextX - x) + Math.abs(nextY - y) !== 1) {
          continue;
        }

        if (barriers[next] || !bodyMask[next] || regionMap[next] !== -1) {
          continue;
        }

        regionMap[next] = seedIndex;
        queue[tail] = next;
        tail += 1;
      }
    }
  });

  return regionMap;
}

function findNearestSelectableIndex(
  seedX: number,
  seedY: number,
  bodyMask: Uint8Array,
  regionMap: Int16Array,
  width: number,
  height: number,
) {
  const centerX = Math.max(0, Math.min(width - 1, Math.round(seedX)));
  const centerY = Math.max(0, Math.min(height - 1, Math.round(seedY)));

  for (let radius = 0; radius <= 48; radius += 1) {
    for (let y = centerY - radius; y <= centerY + radius; y += 1) {
      for (let x = centerX - radius; x <= centerX + radius; x += 1) {
        if (x < 0 || x >= width || y < 0 || y >= height) {
          continue;
        }

        if (Math.abs(x - centerX) !== radius && Math.abs(y - centerY) !== radius) {
          continue;
        }

        const index = y * width + x;

        if (bodyMask[index] && regionMap[index] === -1) {
          return index;
        }
      }
    }
  }

  return -1;
}

function paintSelectedRegion(
  canvas: HTMLCanvasElement,
  regionMap: Int16Array,
  config: MuscleFigureConfig,
  selectedId: string,
) {
  const context = canvas.getContext("2d");

  if (!context) {
    return;
  }

  const width = config.width;
  const height = config.height;
  const imageData = context.createImageData(width, height);
  const selectedIndexes = new Set(
    config.seeds
      .map((seed, index) => (seed.id === selectedId ? index : -1))
      .filter((index) => index >= 0),
  );

  if (selectedIndexes.size > 0) {
    for (let index = 0; index < regionMap.length; index += 1) {
      if (selectedIndexes.has(regionMap[index])) {
        const pixelIndex = index * 4;
        imageData.data[pixelIndex] = 103;
        imageData.data[pixelIndex + 1] = 199;
        imageData.data[pixelIndex + 2] = 122;
        imageData.data[pixelIndex + 3] = 105;
      }
    }
  }

  context.clearRect(0, 0, width, height);
  context.putImageData(imageData, 0, 0);
}
