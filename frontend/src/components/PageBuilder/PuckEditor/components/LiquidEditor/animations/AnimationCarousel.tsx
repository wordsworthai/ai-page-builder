import React, { useState, useEffect, useCallback } from 'react';
import { Box, styled, keyframes } from '@mui/material';
import { BlocksAssembling } from './BlocksAssembling';
import { ContentFlowing } from './ContentFlowing';
import { DesignPolish } from './DesignPolish';
import { LaunchSequence } from './LaunchSequence';

const ANIMATION_DURATION = 12000; // 12 seconds per animation
const TRANSITION_DURATION = 1500; // 1.5s crossfade

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const fadeOut = keyframes`
  from { opacity: 1; }
  to { opacity: 0; }
`;

const CarouselContainer = styled(Box)({
  width: '100%',
  height: '100%',
  position: 'relative',
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

const AnimationWrapper = styled(Box)<{ isVisible: boolean; isExiting: boolean }>(
  ({ isVisible, isExiting }) => ({
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: isVisible && !isExiting ? 1 : 0,
    animation: isExiting
      ? `${fadeOut} ${TRANSITION_DURATION}ms ease-out forwards`
      : isVisible
      ? `${fadeIn} ${TRANSITION_DURATION}ms ease-in forwards`
      : 'none',
    pointerEvents: isVisible ? 'auto' : 'none',
  })
);

const animations = [
  { id: 'blocks', Component: BlocksAssembling, label: 'Building layout...' },
  { id: 'content', Component: ContentFlowing, label: 'Adding content...' },
  { id: 'design', Component: DesignPolish, label: 'Polishing design...' },
  { id: 'launch', Component: LaunchSequence, label: 'Preparing launch...' },
];

interface AnimationCarouselProps {
  isActive: boolean;
}

export const AnimationCarousel: React.FC<AnimationCarouselProps> = ({ isActive }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [exitingIndex, setExitingIndex] = useState<number | null>(null);

  const goToNext = useCallback(() => {
    setExitingIndex(currentIndex);
    setCurrentIndex((prev) => (prev + 1) % animations.length);
    
    // Clear exiting state after transition
    setTimeout(() => {
      setExitingIndex(null);
    }, TRANSITION_DURATION);
  }, [currentIndex]);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(goToNext, ANIMATION_DURATION);
    return () => clearInterval(interval);
  }, [isActive, goToNext]);

  return (
    <CarouselContainer>
      {animations.map((animation, index) => {
        const isVisible = index === currentIndex || index === exitingIndex;
        const isExiting = index === exitingIndex;
        const { Component } = animation;

        return (
          <AnimationWrapper
            key={animation.id}
            isVisible={isVisible}
            isExiting={isExiting}
          >
            <Component isActive={isVisible && isActive} />
          </AnimationWrapper>
        );
      })}
    </CarouselContainer>
  );
};

export default AnimationCarousel;