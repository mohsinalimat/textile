## Textile ERP App for ERPNext

The Textile App is a manufacturing workspace for [ERPNext](https://github.com/frappe/erpnext) that adds workflows and customizations for the textile manufacturing process.

The app workflow and design principle puts the user first, where only minimal user input is required to ensure that production process and stock levels stay in sync in real-time. The app is in active development, and not released officially yet.

Note: This app only works on ParaLogic's fork of [Frappe](https://github.com/ParaLogicTech/frappe) and [ERPNext](https://github.com/ParaLogicTech/erpnext) and will not work on the official version of Frappe/ERPNext.

## Features 🎁

### 1. Digital printing on textiles 🖨️ (developed, in optimization phase)
Adds a new **Print Order** DocType for roll-to-roll printing.
- Create print orders for both repeats (seamless or rapport designs) and panels (with gaps between each panel).
- Automatically calculate print length based on design file dimensions, gaps, and required quantity.
- Automatically calculate fabric required based on above considerations and definable process wastage.
- Allows for choosing primary quantity based on fabric length, design length or number of panels.
- Directly see production quantity on item level: printed quantity, packed quantity and delivered quantity.
- Maintains fabric traceability by batch numbers and packing labels
- Generates fabric ledger for tracking every step of the production, packing and delivery process.
- Accomodates for unprinted areas in printing head and tail, fabric shrinkage and scrapped fabrics.

Unique BOM concept for highly accurate stock consumptions.
- Flexible BOM's for reactive/disperse/pigment (based on linear-meters, area and weight), and sublimation (based on linear-meters and area).
- BOM's with drop-down on Print Order level to allow recipe selections at each step, e.g. coating and finishing.
- Smart BOM's for sublimation to ensure right papers are pre-selected based on fabric width.

### 2. Greige fabric pre-treatment ☀️  (developed, in optimization phase) 
Process steps for pre-treatment of greige fabrics: singeing, desizing, scouring, bleaching and washing.
- Independent BOM's and operation tracking for each process step.
- Accruate WIP stock for each process step.

## Roadmap & Wishlist ✨
- Extensive testing
- Piece goods manufacturing (stitching) 👚
- Drag-and-drop production re-scheduling tool
- Yarn manufacturing 🧵 (planned for 2024)

## Support 🤗
Please contact us for any support or other inquiries via our website https://paralogic.io.

## Contributing 🤝
You can fork this repository and create a pull request to contribute code. By contributing to Textile App for ERPNext, you agree that your contributions will be licensed under its GNU General Public License (v3). 

## GNU/General Public License 
The ERPNext Pakistan Workspace code is licensed as GNU General Public License (v3) and the copyright is owned by ParaLogic and Contributors (see [license.txt](license.txt)).

## Screenshots

### Dashboard / Workspace

<img src="https://raw.githubusercontent.com/ParaLogicTech/textile/version-14/docs/screenshots/printing-workspace.png" alt="Printing Workspace">

### Print Order
<img src="https://raw.githubusercontent.com/ParaLogicTech/textile/version-14/docs/screenshots/print-order.png" alt="Print Order">

### Work Order List
<img src="https://raw.githubusercontent.com/ParaLogicTech/textile/version-14/docs/screenshots/work-order-list.png" alt="Work Order List">

### Simplified Production Entry
<img src="https://raw.githubusercontent.com/ParaLogicTech/textile/version-14/docs/screenshots/print-production-dialog.png" alt="Print Production Dialog">
