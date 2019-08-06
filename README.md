# PGE-Wall

## Inspiration

![@stevewoz](https://i.imgur.com/2UsFfs7.png)

Steve Woz (@stevewoz) made a fairly dubious claim on Twitter that he would be able to payback his two powerwalls in Los Gatos after just 3 years.  Los Gatos where Woz lives is under PG&E for electricity which happens to be the same company I pay for my electric use.  So, writing a tool to figure out the somewhat complex math of battery powered "arbitrage" was a win-win for me.  Either I would get to prove Woz wrong, or, I would be wrong and should run out and buy a stack of powerwall's myself for investment reasons alone.

## Use

### Requirements

This tool is designed to help determine a ROI (Return on Investment) for using a Tesla Powerwall with PG&E.  It takes in data from your household PG&E usage, and simulates the time period with a configurable number of batteries and rate plans.

I suppose this could work for any other electric company as well, but would likely require tweaks, as I've built it to pull from the CSV hourly "Green" download button that is available from PG&E.  Feel free to Fork.

### Just use it

[https://pgewall.badpirate.net](https://pgewall.badpirate.net)

### Run Locally

1. Pull this repo
1. Install npm if you haven't
1. `npm install` to install dependencies
1. To just run and use: `npm run-script local`
1. To develop use: `npm run-script dev`
1. Finally to stop: `npm stop`

## Disclaimer

I put this together using what information I could find on the internet, and make no disclaimer towards the accuracy of the results.  PLEASE do your own math and make your own decisions.  I am in now way responsible for any purchase decisions you make or don't make based on playing with my tool.

## Feedback

Feel free to file or fix issues in your own forks, but fork back and let me know.  If I've done something wrong, or there is a better PG&E plan than EV-A for this setup, or I missed a decimal place somewhere let me know as it means $$$ :)

## Explanation

First things first -- You are unlikely to pay off your powerwall with electric bill savings.  The reason behind this is that the most profitable use "Power Arbitrage" (Charging a battery when grid power is inexpensive and then returing it using Net Energy Metering when the grid power is more expensive) is disallowed by PG&E, and disabled by Tesla (Though the battery is perfectly capable).  But it is still possible to defer some costs thanks to having a battery, and in some (odd cases, which I'll call out below you can pay off your equipment entirely in savings.

### Time of Use

Savings for Powerwall are possible without arbitrage thanks to Time of Use.  PG&E offers a variety of rate plans that offer cheaper prices for electricity during "Off-Peak" periods vs "Peak" periods of use and Powerwall 2 can be configured to switch from "Charging" to "Discharging" mode on a standard date and time schedule to align with these periods.  The savings then are derived by charging when electricity is cheap, and using your battery whenever possible instead of grid power, saving you the difference between the two rate periods.  (Usually between .10 and .40 per kWH).  Some rate plans (Like those that are available to electric vehicle owners) have a much bigger difference in price between peak and off peak, and so it may be ideal to get on one of those plans if you have battery storage.

### Non-Solar PG&E Power-wall use

 If you can get Solar, it's a better ROI normally to do so.  But if you can't (don't have a proper roof, permitting issues, or live in a land of permanent shadow) but can still get a Powerwall, then Tesla can setup a powerwall for you in "Grid" mode.  The Powerwall will be setup to charge from the grid, but won't be able to discharge to the grid. (notice the arrow direction)

 ![Grid Config](https://i.imgur.com/ZwNu3KM.png)

### Solar PG&E Power-wall use

Because there is a giant source of free energy in the sky, solar panels tend to have a better ROI... however, because having Solar comes with NEM (Net Energy Metering) on PG&E, which means that PG&E pays you for any electricity you put back on the grid, both contract and Tesla configuration prevent installation of Powerwall in a way that allows charging from the Grid.  Meaning that while you can sell electricity from your Powerwall back to PG&E, you can only collect that energy from the Sun, and since most Solar energy is generated during peak periods, and storing energy incurs a 10% loss, it's better just to return that power straight to the Grid in most cases.  You can still use the powerwall to power your house during peak (instead of the grid) and charge during off-peak.  But normally your peak energy grid use will be lower (thanks to solar) and so your return on powerwall is likely to be less.  This tool supports uploading Solar data in a CSV, or connecting (maybe, and slowly) to Enphase Enlighten API to pull data.

![Solar Config](https://i.imgur.com/yeHz89V.png)

## The Wizard of Woz

Most of my calculations do not seem to indicate it's easy to get a 3 year payback for a Powerwall, but if you were to have a really odd scenario then it might be possible.  The following conditions optimize payback:

1. High Peak Usage - Computers, Grow Lights, Bitcoin Miners, Jacuzzi's and A/C units all contribute to daytime (peak) usage.  Powerwall can feed those during the day saving $$.  My guess is Woz is mining Bitcoin :D
1. No Solar - Solar panels have a better ROI for the powerwall use case than powerwall does, but if you don't have it, or have as much as your roof can hold and still need more power for the Antminers, then Solar might be a good idea.
1. Electric Vehicle - EV Plan on PG&E has the biggest gap between Peak and Off Peak, and while EV ownership increases electric usage, because they can easily be charged during off-peak, it doesn't matter how many EV's you have, just that you get on the plan.  (And Woz is a Tesla driver).

So my guess is that 3 years is either a little hyperbole, or Woz is secretly trying to get into the Upside down.

![Stranger Things](https://i.imgur.com/XeFLx3K.jpg)
