// FILE: cypress/e2e/auth.cy.ts

describe('Full Art Generation Pipeline', () => {
  beforeEach(() => {
    cy.intercept('GET', 'http://localhost:3001/api/tle-data/gnss', {
      statusCode: 200,
      body: [{
        name: 'GPS MOCK SATELLITE',
        line1: '1 26407U 00040A   24172.50000000  .00000000  00000-0  00000+0 0  9990',
        line2: '2 26407  55.0000 180.0000 0010000 180.0000 180.0000  2.0000000012345'
      }]
    }).as('getTleData');
  });

  it('should allow a user to visualize satellite data and then generate a final piece of art', () => {
    cy.intercept('GET', 'http://localhost:3001/api/tle-data/gnss', { fixture: 'tle-data.json' }).as('getTleData');

    cy.intercept('POST', 'http://localhost:3001/api/art/generate', { fixture: 'test-art.png' }).as('postGenerateArt');

    cy.visit('http://localhost:3000');
    cy.contains('button', 'Visualize Satellite Positions').should('be.visible').click();

    cy.wait('@getTleData');
    cy.get('canvas').should('be.visible');
    cy.contains('button', 'Create Final Artwork').should('be.visible').click();
    cy.wait('@postGenerateArt');

    cy.get('img[alt="AI Generated Artwork"]').should('be.visible').and('have.attr', 'src').and('match', /^blob:/);
  });
});