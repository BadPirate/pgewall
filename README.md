# PGE-Wall
## Inspiration

![@stevewoz](https://i.imgur.com/2UsFfs7.png)

Steve Woz (@stevewoz) made a fairly dubious claim on Twitter that he would be able to payback his two powerwalls in Los Gatos after just 3 years.  Los Gatos where Woz lives is under PG&E for electricity which happens to be the same company I pay for my electric use.  So, writing a tool to figure out the somewhat complex math of battery powered "arbitrage" was a win-win for me.  Either I would get to prove Woz wrong, or, I would be wrong and should run out and buy a stack of powerwall's myself for investment reasons alone.
## Use
### Requirements
This tool is designed to provide a power calculation for "Power Arbitrage" on PG&E network, but in order to be profitable here you'll need to be on "NEM" billing, which for PG&E means you have Solar.

1.  PG&E California Customer
2.  Have Solar and NEM billing

I suppose this could work for any other company that provides NEM like, but would likely require tweaks, as I've built it to pull from the CSV hourly "Green" download button that is available from PG&E.  Feel free to Fork.

### Just use it
https://pgewall.badpirate.net

### Run Locally

1.  Pull this repo
1.  Install npm if you haven't
1.  `npm install` to install dependencies
1.  `npm start` This should launch the project in your browser.

## Explanation
### Assumptions
Here are a few of the assumptions I made, I backed them up with research in Tesla FAQ, PG&E website, as well as phone calls to representatives on both:
*  Powerwall 2 has 2 configurations, Solar, or Grid
*  In the Solar Configuration, your Powerwall is not allowed to interact at all with the grid.  That means it **must charge from solar** and cannot discharge onto the grid.
*  In the Grid configuration, you can charge from, but not discharge to the grid.
*  In the Grid configuration you can program "Charge" and "Discharge" time periods
*  Federal Solar Tax credit (30% of cost) is only available in the Solar configuration
*  PG&E Time of Use plans with a different Winter / Summer rate schedule will result in less value for arbitrage, and as such I haven't included this configuration (Go fork yourself)

Because of this, in order to make an ROI on your powerwall, you have to choose Grid (non-solar) installation, because otherwise you won't be able to charge of grid, and thus can't arbitrage.  Downsides to this are that you won't be able to get Federal Tax Credit (because your storage isn't associated with a solar installation), to lower initial price, and you won't be able to recharge your batteries from solar during an extended blackout (doomsday scenario).  However, it's the only mode that can actually save you money on your electric bill.

### NEM
Net Energy Metering on PG&E means that you get paid to put money back on the grid based on the current price when you put it back on the grid.  PG&E only allows putting power back on the grid for Generation (Solar, or otherwise).  **They do not allow you to put back electric that you pulled off the grid earlier** for example, a battery storage unit alone does not let you use NEM, and you cannot (limited by Powerwall software and PG&E contract) put electricity onto the grid from Powerwall.

### TOU
Time of Use - This is the standard plan with NEM and the only one that gives value for Arbitrage.  It means that the amount you pay (and get paid) for electicity depends on when you use it (or put power back).  For PG&E this is 3 periods:
* Peak - Most expensive, during daylight hours
* Off Peak - Least expensive, late night early morning
* Shoulder - Any time that falls between peak and off peak, some middle rate

### Arbitrage
Here's how you can make money with Powerwall on PG&E NEM TOU plan.  By charging powerwall during the day and discharging it whenever you would otherwise use grid power during peak or shoulder time periods, you can effictively save yourself a portion of the difference in the rates between these periods.  Note that Powerwall won't let you put electricity back onto the grid, so this only works to cover the gap when solar doesn't cover your household drain (Cloudy, too dark, usage higher than solar output)

## How it works
After uploading data for a period of time (365 days is a good value as this will allow you to do ROI calculations) - Putting in the cost and time spans for each of the rate periods, this app goes through each hourly line in the PG&E NEM chart, and simulates having a powerwall instead.  Charging the powerwall at night during off peak usage, and discharging if there is any power left in the battery during peak and shoulder periods whenever grid power is used (but doing nothing when there is no drain).  You can tweak all the values (which I've prefilled with the values I had for Sunnyvale CA and my Solar installation based on your own billing)
### ROI Calculation
Battery capacity decays over time, and Tesla warranty suggests no more than 30% decay over 10 years.  This decay isn't straight forward for determining ROI as daily ability to arbitrage depends on how much capacity is used.  To simulate this, I take the first 365 days of data and run the calculation 10 times for each of 10 years, decaying the battery a little each year and determing what the arbitrage footprint and thus the savings would be.

## Results
Using this for my own situation (I have a home in Sunnyvale, 2 electric vehicles, Solar Panels that cover only about 50% of my use thanks to the cars, and PG&E NEM) I found that paydown for 1 Powerwall 2 would be around 7-8 years, 2 walls would be 8-9 years and 3 walls would be 10+ years.  Honestly can't think of way that my situation could be more ideal, as most Solar installations cover more of the electric use than mine does, I've got tons of drain (though my cars are both set to drain during off-peak so their arbitrage doesn't help at night), and having electric cars allow me the higher rate difference EV-A Time of Use plan.  So I'm pretty sure Woz used some magic math to help him make the decision to buy new toys... but...

## Disclaimer
I put this together using what information I could find on the internet, and make no disclaimer towards the accuracy of the results.  PLEASE do your own math and make your own decisions.  I am in now way responsible for any purchase decisions you make or don't make based on playing with my tool.

## Feedback
Feel free to file or fix issues in your own forks, but fork back and let me know.  If I've done something wrong, or there is a better PG&E plan than EV-A for this setup, or I missed a decimal place somewhere let me know as it means $$$ :)