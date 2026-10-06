import React from 'react';
import {useTheme} from '../theme/ThemeContext';
import ParagraphFittedText from './ParagraphFittedText';
import SingleLineFittedText from './SingleLineFittedText';

type Props = {
  children: string;
  fontSize: number;
  color?: string;
  singleLine?: boolean;
};

// Fit questions and letter groups using measured native glyph dimensions.
const FittedText = ({children, fontSize, color, singleLine = false}: Props) => {
  const {colors} = useTheme();
  const textColor = color ?? colors.onSurface;
  return singleLine ? (
    <SingleLineFittedText fontSize={fontSize} color={textColor}>
      {children}
    </SingleLineFittedText>
  ) : (
    <ParagraphFittedText fontSize={fontSize} color={textColor}>
      {children}
    </ParagraphFittedText>
  );
};

export default FittedText;
