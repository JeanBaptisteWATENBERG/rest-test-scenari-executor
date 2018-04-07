import { IAssertion } from './models/Assertion';
import { evalContentVariable, expectAssertAsJest } from './utils';

describe('evalContentVariable', () => {

    it('should replace var by it\'s value when value is defined', () => {
        // Given
        const variables = {varName: 'varValue'};
        // When
        const evaluationResult = evalContentVariable({variables, content: '${varName}'});
        // Then
        expect(evaluationResult).toEqual(variables.varName);
    });

    it('should evaluate multiple time a single variable value', () => {
        // Given
        const variables = {varName: 'varValue'};
        // When
        const evaluationResult = evalContentVariable({variables, content: '${varName} aaaa ${varName} dds ${varName}'});
        // Then
        expect(evaluationResult).toEqual(`${variables.varName} aaaa ${variables.varName} dds ${variables.varName}`);
    });

    it('should evaluate multiple time multiple variable values', () => {
        // Given
        const variables = {varName1: 'varValue1', varName2: 'varValue2'};
        // When
        const evaluationResult = evalContentVariable({
            content: '${varName1} aaaa ${varName2} dds ${varName1}',
            variables,
        });
        // Then
        expect(evaluationResult).toEqual(`${variables.varName1} aaaa ${variables.varName2} dds ${variables.varName1}`);
    });

    it('should evaluate a dynamic variable name', () => {
        // Given
        const variables = {varName: 'varValue', varValue: 'realValue'};
        // When
        const evaluationResult = evalContentVariable({variables, content: '${${varName}}'});
        // Then
        expect(evaluationResult).toEqual(`${variables.varValue}`);
    });

    it('should replace partial var when mis formed', () => {
        // Given
        const variables = {varName: 'varValue'};
        // When
        const evaluationResult = evalContentVariable({variables, content: '${sd${varName}'});
        // Then
        expect(evaluationResult).toEqual(`\${sd${variables.varName}`);
    });

    it('should return the original text when no variables are evaluated', () => {
        // Given
        const variables = {varName: 'varValue'};
        // When
        const evaluationResult = evalContentVariable({variables, content: '}sd${varName'});
        // Then
        expect(evaluationResult).toEqual('}sd${varName');
    });

    it('should return null when original object is null', () => {
        // Given
        const variables = {varName: 'varValue'};
        // When
        // tslint:disable-next-line
        const evaluationResult = evalContentVariable({variables, content: null});
        // Then
        expect(evaluationResult).toEqual(null);
    });

    it('should throw an error when trying to evaluate an unknown variable', () => {
        // Given
        const variables = {varName: 'varValue'};
        // When
        const evaluation = () => evalContentVariable({variables, content: '${unknownVariable}'});
        // Then
        expect(evaluation).toThrow(`Variable unknownVariable has not yet been initialized`);
    });

});

describe('expectAssertAsJest', () => {

    it('should throw an error when assertion type is not supported', () => {
        // Given
        const evaluatedVariables = {};
        const expectBaseFunction = expect('something');
        const receivedValue = 'something';
        const assertionDefinition: IAssertion = {
            expect: 'A random expectation',
            in: 'body',
            type: 'unknownType',
        };
        // When
        const convertion = () => expectAssertAsJest({
            assertionDefinition,
            evaluatedVariables,
            expectBaseFunction,
            receivedValue,
        });
        // Then
        expect(convertion).toThrow(`Assertion type ${assertionDefinition.type} is not supported`);
    });

});
