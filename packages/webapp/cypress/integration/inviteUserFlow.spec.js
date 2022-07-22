describe.only('Invite user tests', () => {
  let userEmail;
  let userPassword;

  before(() => {
    cy.getEmail().then((email) => {
      userEmail = email;
    });

    cy.getPassword().then((password) => {
      userPassword = password;
    });
  });

  it('Invite an existing user with a chosen langauge', () => {
    //Test for LF-2301
    //after running happy path test
    //create a user account with language set to Spanish
    //login to the default farm created by the happy path tests
    //invite the spanish user to the default farm
    //Spanish user should receive an invitation email in spanish
    //repeat for all languages
  });

  it.only('Invite farm worker', () => {
    //create test data
    let count = 0;
    let emailOwner;
    let emailUser;

    const gender = 'Male';
    const fullName = 'Test Farmer';
    const password = `${userPassword}+@`;
    const farmName = 'UBC FARM';
    const location = '49.250833,-123.2410777';
    const fieldName = 'Test Field';
    const workerName = 'Test Worker';
    const testCrop = 'New Crop';
    const role = 'Manager';
    const inviteeRole = 'Farm Worker';

    //worker details
    const language = ['English', 'French', 'Portuguese', 'Spanish'];
    const wage = 12;
    const number = 120012432;
    const birthYear = 1987;

    cy.visit('/');

    language.forEach((lang, idx) => {
      let usrname = userEmail.indexOf('@');
      emailOwner = userEmail.slice(0, usrname) + '+' + idx + userEmail.slice(usrname);
      emailUser = userEmail.slice(0, usrname) + '+' + idx + '0' + userEmail.slice(usrname);

      //Login as a new user
      cy.newUserLogin(emailOwner);

      //create account

      cy.createAccount(emailOwner, fullName, gender, null, null, password);

      cy.wait(2000);
      //Get Started page
      cy.getStarted();

      //Add farm page
      cy.addFarm(farmName, location);

      //role selection page
      cy.roleSelection(role);

      //Consent page
      cy.giveConsent();

      //interested in organic
      cy.interestedInOrganic();

      //who is your certifier(select BCARA)
      cy.selectCertifier();

      //onboarding outro
      cy.onboardingOutro();

      //farm home page
      cy.homePageSpotlights();

      //Add a farm worker to the farm
      cy.goToPeopleView();

      cy.inviteUser(inviteeRole, workerName, emailUser, gender, lang, wage, birthYear, number);

      cy.url().should('include', '/people');
      cy.contains(workerName).should('exist');

      //logout
      cy.logOut();

      //login as farm worker, create account and join farm
      cy.acceptInviteEmail();

      cy.get('[data-cy=invitedCard-createAccount]').click();
      cy.get('[data-cy=invitedUser-proceed]').click();

      //create account
      cy.get('[data-cy=invited-password]').type(password);
      cy.get('[data-cy=invited-createAccount]').click();

      //Consent page
      cy.giveConsent();

      cy.get('[data-cy=joinFarm-successContinue]').should('not.be.disabled').click();

      cy.get('[data-cy=chooseFarm-proceed]').should('not.be.disabled').click();

      //farm home page
      cy.get('[data-cy=spotlight-next]')
        .contains('Next')
        .should('exist')
        .and('not.be.disabled')
        .click();
      cy.get('[data-cy=spotlight-next]')
        .contains('Next')
        .should('exist')
        .and('not.be.disabled')
        .click();
      cy.get('[data-cy=spotlight-next]')
        .contains('Next')
        .should('exist')
        .and('not.be.disabled')
        .click();
      cy.get('[data-cy=spotlight-next]')
        .contains('Got it')
        .should('exist')
        .and('not.be.disabled')
        .click();

      //logout
      cy.get('[data-cy=home-profileButton]').should('exist').click();
      cy.get('[data-cy=navbar-option]')
        .contains('Log Out')
        .should('exist')
        .and('not.be.disabled')
        .click();
    });
  });

  it('Invite a new user and select invitation langauge', () => {
    //Test for LF-2366
    const userName = 'NewUser';
    const uuid = () => Cypress._.random(0, 1e6);
    const id = uuid();
    const userEmail = `${userName}${id}@example.com`;
    let count = 1;
    //after running happy path test
    cy.visit('/');
    //login as an admin user
    cy.loginFarmOwner();
    //navigate to the people view
    cy.visit('/people');
    //Click invite a user
    cy.contains('Invite User').click();
    //Input a name, select a role and an invitation language and click send invitation
    cy.get('[data-cy=invite-fullName]').should('exist').type(userName);
    cy.contains('Choose Role').should('exist').click({ force: true });
    cy.contains('Farm Worker').should('exist').click();
    cy.get('[data-cy=invite-email]').should('exist').type(userEmail);
    count++;
    cy.contains('English').should('exist').click({ force: true });
    cy.contains('Spanish').should('exist').click();
    //cy.intercept('POST', '/user/invite').as('invite');
    cy.get('[data-cy=invite-submit]').should('exist').and('not.be.disabled').click();
    //Ensure invitation is in correct language
    cy.task('getLastEmail', userEmail).then((email) => {
      cy.log(email);
    });
  });
});
